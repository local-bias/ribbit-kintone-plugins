import { atom } from '@repo/jotai';
import type { ModelMessage } from 'ai';
import { checkChatConfig } from '@/lib/ai/chat-availability';
import {
  type ApprovalDecision,
  appendUserMessage,
  applyAbort,
  applyGenerateError,
  applyGenerateOutcome,
  type ChatState,
  canSend,
  continueAfterStepLimit,
  createChatState,
  decideApproval,
  messagesForGeneration,
  remainingSteps,
  retryAfterError,
} from '@/lib/ai/chat-session';
import type { AiError } from '@/lib/ai/errors';
import type { ChatRuntime } from '../chat/runtime';
import { servicesAtom } from './launcher';

/**
 * チャットの状態
 *
 * 進行は`lib/ai/chat-session.ts`の純粋関数で決め、ここではAgentの呼び出し・中断・遅れて届いた結果の破棄を扱う。
 * `ai`本体は`services.createChatRuntime`が最初の送信で評価する(この状態からは型だけを参照する)
 *
 * @see docs/07-ai-tools.md 2章、docs/06-ui.md 6章
 */

export const chatStateAtom = atom<ChatState>(createChatState());

/** 生成を始めた時刻(経過秒数の表示に使う)。生成中でなければ`null` */
export const generationStartedAtAtom = atom<number | null>(null);

/** AIの設定と、APIキーの登録状況 */
export const chatConfigAtom = atom((get) => {
  const services = get(servicesAtom);
  return services === null ? null : checkChatConfig(services.common);
});

/** チャットを使えるか(許可リスト)。パネルやメニューを開いて初めて判定する */
export const canChatAtom = atom(async (get): Promise<boolean> => {
  const services = get(servicesAtom);
  return services === null ? false : services.loadCanChat();
});

/**
 * チャットを出すか(AIの設定とAPIキーの登録が済み、利用者がチャットを使える)
 *
 * 設定が済んでいなければ、権限の判定(アプリ管理者かの確認)もしない
 */
export const chatAvailableAtom = atom(async (get): Promise<boolean> => {
  const config = get(chatConfigAtom);
  if (config === null || !config.ok) return false;
  return get(canChatAtom);
});

/** 実行部分は画面(詳細⇄編集など)ごとに作る。システムプロンプトに画面とレコードIDを入れるため */
type RuntimeEntry = { key: string; runtime: Promise<ChatRuntime> };
const runtimeAtom = atom<RuntimeEntry | null>(null);
const abortControllerAtom = atom<AbortController | null>(null);
/** 生成のたびに増やす。止めた・新しい会話にした後に届いた結果を捨てるため */
const generationIdAtom = atom(0);

const UNKNOWN_ERROR = (detail: string): AiError => ({ kind: 'unknown', retryable: false, detail });

const runtimeKey = () => `${location.pathname}${location.hash}`;

/**
 * 生成中に終わったstepのメッセージ(往復ごとの進み具合を画面に出すため)
 *
 * 表示だけに使い、履歴には入れない。履歴は生成全体が成功したときにまとめて確定する
 */
export const inflightMessagesAtom = atom<ModelMessage[]>([]);

/** いまの履歴でAgentを呼び、結果を状態へ反映します */
const generateAtom = atom(null, async (get, set) => {
  const services = get(servicesAtom);
  const config = get(chatConfigAtom);
  if (services === null || config === null || !config.ok) {
    set(chatStateAtom, (state) => applyGenerateError(state, UNKNOWN_ERROR('not-configured')));
    return;
  }
  // 生成中にもう一度呼ばれても、2つ目の生成を始めない
  if (get(abortControllerAtom) !== null) return;
  const maxSteps = services.common.maxToolSteps;
  const key = runtimeKey();
  let entry = get(runtimeAtom);
  if (entry === null || entry.key !== key) {
    entry = { key, runtime: services.createChatRuntime(config.endpoint) };
    set(runtimeAtom, entry);
  }
  const id = get(generationIdAtom) + 1;
  const controller = new AbortController();
  set(generationIdAtom, id);
  set(abortControllerAtom, controller);
  set(generationStartedAtAtom, Date.now());

  let runtime: ChatRuntime | null = null;
  try {
    runtime = await entry.runtime;
    const state = get(chatStateAtom);
    const outcome = await runtime.run({
      messages: messagesForGeneration(state),
      remainingSteps: remainingSteps(state, maxSteps),
      abortSignal: controller.signal,
      onStep: (messages) => {
        if (get(generationIdAtom) === id) set(inflightMessagesAtom, messages);
      },
    });
    if (get(generationIdAtom) !== id) return;
    set(chatStateAtom, (current) => applyGenerateOutcome(current, outcome, maxSteps));
  } catch (error) {
    if (get(generationIdAtom) !== id) return;
    if (runtime === null) {
      // 読み込みに失敗した実行部分は、次の送信で作り直す
      set(runtimeAtom, null);
    }
    const aiError = runtime?.classifyError(error) ?? UNKNOWN_ERROR(String(error));
    set(chatStateAtom, (current) =>
      aiError.kind === 'aborted' ? applyAbort(current) : applyGenerateError(current, aiError)
    );
  } finally {
    if (get(generationIdAtom) === id) {
      set(abortControllerAtom, null);
      set(generationStartedAtAtom, null);
      set(inflightMessagesAtom, []);
    }
  }
});

export const sendMessageAtom = atom(null, async (get, set, text: string) => {
  const trimmed = text.trim();
  const services = get(servicesAtom);
  if (trimmed === '' || services === null || !canSend(get(chatStateAtom))) return;
  // 画面の表示だけに頼らず、送る前にもチャットの権限を確かめる
  if (!(await services.loadCanChat())) return;
  set(chatStateAtom, (state) => appendUserMessage(state, trimmed));
  await set(generateAtom);
});

export const decideApprovalAtom = atom(
  null,
  async (get, set, params: { approvalId: string } & ApprovalDecision) => {
    const { approvalId, ...decision } = params;
    const maxSteps = get(servicesAtom)?.common.maxToolSteps ?? 0;
    set(chatStateAtom, (state) => decideApproval(state, approvalId, decision, maxSteps));
    // 全ての承認を判断し終えたら、同じ会話で再開する(実行はAI SDKが行う)
    if (get(chatStateAtom).status === 'generating') {
      await set(generateAtom);
    }
  }
);

export const continueChatAtom = atom(null, async (get, set) => {
  set(chatStateAtom, continueAfterStepLimit);
  if (get(chatStateAtom).status === 'generating') await set(generateAtom);
});

export const retryChatAtom = atom(null, async (get, set) => {
  set(chatStateAtom, retryAfterError);
  if (get(chatStateAtom).status === 'generating') await set(generateAtom);
});

/**
 * 生成を止めます
 *
 * 止まるのは待機だけで、送信済みのリクエストは完走し課金される(kintoneのproxyは中断できない)。
 * 後から届いた結果は捨てる
 */
export const stopGenerationAtom = atom(null, (get, set) => {
  get(abortControllerAtom)?.abort(new DOMException('Stopped by the user', 'AbortError'));
  set(generationIdAtom, (id) => id + 1);
  set(abortControllerAtom, null);
  set(generationStartedAtAtom, null);
  set(inflightMessagesAtom, []);
  if (get(chatStateAtom).status === 'generating') {
    set(chatStateAtom, applyAbort);
  }
});

/** 新しい会話にする。システムプロンプト(登録済みのカスタマイズの一覧など)も作り直す */
export const newConversationAtom = atom(null, (_get, set) => {
  set(stopGenerationAtom);
  set(runtimeAtom, null);
  set(chatStateAtom, createChatState());
});

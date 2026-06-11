import {
  getAllRecords,
  getCurrentRecord,
  setCurrentRecord,
  updateAllRecords,
  updateRecord,
} from '@konomi-app/kintone-utilities';
import { atom, currentAppIdAtom, type Getter, type Setter } from '@repo/jotai';
import { nanoid } from 'nanoid';
import type { AIChatMessage } from '@/lib/ai';
import { chatComplete } from '@/lib/ai';
import { GUEST_SPACE_ID } from '@/lib/global';
import type { PluginCondition } from '@/schema/plugin-config';
import { pluginConfigAtom, validPluginConditionsAtom } from '../public-state';

/** 表示中の kintone 画面の種別 */
export type ScreenKind = 'index' | 'detail' | 'create' | 'edit';

/** AI が要求できるアクション (種別ごとの判別ユニオン) */
export type AIAction =
  | {
      type: 'updateRecord';
      title?: string;
      description?: string;
      /** 更新対象のフィールド (フィールドコード → 新しい値) */
      fields: Record<string, string | number | boolean>;
    }
  | {
      type: 'getRecords';
      title?: string;
      description?: string;
      /** 取得時のクエリ (例: `"顧客名" = ""`) */
      query: string;
      /** 取得するフィールド (省略時は全フィールド) */
      fields?: string[];
    }
  | {
      type: 'updateRecords';
      title?: string;
      description?: string;
      /** 更新対象 (id + フィールドコード→値) */
      records: {
        id: string | number;
        fields: Record<string, string | number | boolean>;
      }[];
    };

/** 承認状態 */
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  /** 表示用テキスト (ai-action ブロック除去済み) */
  content: string;
  /** AI 呼び出し中の暫定メッセージかどうか */
  pending?: boolean;
  /** エラー表示用 */
  error?: boolean;
  /** 添付ファイル名 (UI 表示用) */
  attachments?: string[];
  /** AI が要求した実行アクション (承認待ち) */
  action?: AIAction;
  /** アクションの状態 */
  actionStatus?: ActionStatus;
  /** アクション実行時のエラーメッセージ */
  actionError?: string;
  /** 折りたたみ表示用の見出し (指定時は本文を details/summary でラップして表示) */
  collapsible?: boolean;
  /** 折りたたみ時のラベル */
  summary?: string;
}

/** チャットパネルの開閉状態 */
export const chatOpenAtom = atom<boolean>(false);

/** ファイル添付パネルの表示状態 (ドラッグオーバー検知時に true) */
export const fileAttachOpenAtom = atom<boolean>(false);

/** チャット履歴 */
export const chatMessagesAtom = atom<ChatMessage[]>([]);

/** ユーザー入力中のテキスト */
export const chatInputAtom = atom<string>('');

/** 添付済みファイル */
export const attachedFilesAtom = atom<File[]>([]);

/** 選択中のプロンプトテンプレート (id) - null なら手動の素のチャット */
export const selectedConditionIdAtom = atom<string | null>(null);

/** AI 呼び出し中フラグ */
export const isThinkingAtom = atom<boolean>(false);

/** 表示中画面の種別 (event.tsx から更新) */
export const screenKindAtom = atom<ScreenKind | null>(null);

/** 詳細画面のレコード ID (event.tsx から更新) */
export const currentRecordIdAtom = atom<string | number | null>(null);

/** 表示中画面から事前取得したコンテキスト */
export const kintoneContextAtom = atom<string>('');

/**
 * AI に教える「アクションプロトコル」のシステムプロンプト
 *
 * 編集系の画面 (detail/create/edit) にいるときのみ送信し、
 * AI が JSON コードブロックで編集要求を返してきたら UI 側で承認カードを表示する。
 */
export function buildActionProtocolPrompt(screen: ScreenKind | null): string {
  if (!screen) return '';
  const common = [
    '# 利用可能なアクション',
    'ユーザーが kintone レコードの取得・編集を依頼した場合、応答の **末尾** に `ai-action` フェンスのコードブロックを **1 つだけ** 記述してください。フェンス言語は必ず `ai-action` です。',
    'アクションは「ユーザーが「はい」ボタンを押した時にのみ」実行されます。あなたは勝手に実行できません。アクションを返す場合は、本文で目的を簡潔に説明し、最後に「実行の許可をお願いします」と必ず添えてください。',
    '実行が承認されると、結果が次の user メッセージとして自動的にあなたに送られてきます。それを踏まえて次の手順を提案してください。',
    'ユーザーが単に質問しているだけのときは、アクションを出力してはいけません。',
  ];
  if (screen === 'index') {
    return [
      ...common,
      '',
      '## 現在の画面: レコード一覧画面',
      '一覧画面では、まずレコードを **取得** し、その結果を見てから **一括更新** を提案する 2 段階で進めてください。',
      '',
      '### アクション 1: getRecords (レコード取得)',
      '```ai-action',
      '{',
      '  "type": "getRecords",',
      '  "title": "対象レコードの取得",',
      '  "description": "<どんな条件で何件くらい取得するかの説明>",',
      '  "query": "<kintone クエリ文字列。例: 顧客名 = \\"\\" order by レコード番号 asc>",',
      '  "fields": ["<取得するフィールドコード>"]',
      '}',
      '```',
      '- `query` は kintone のクエリ構文で、`limit`/`offset` は付けないでください (内部で全件取得します)',
      '- 空欄判定は `フィールドコード = ""` です',
      '- 全件取得が危険な場合は、件数を絞るクエリにしてください',
      '',
      '### アクション 2: updateRecords (一括更新)',
      '取得結果を確認した **次のターン** で、必要に応じて以下を返してください。',
      '```ai-action',
      '{',
      '  "type": "updateRecords",',
      '  "title": "<簡潔な見出し>",',
      '  "description": "<どのレコードに何をするかの説明>",',
      '  "records": [',
      '    { "id": <レコードID>, "fields": { "<フィールドコード>": "<新しい値>" } }',
      '  ]',
      '}',
      '```',
      '- `id` は取得結果の `$id.value` (数値) を必ず使用してください',
      '- フィールド値は **文字列** で記述してください',
      '- 同じターンに `getRecords` と `updateRecords` を両方書いてはいけません',
    ].join('\n');
  }
  const targetLabel =
    screen === 'detail'
      ? 'レコード詳細画面'
      : screen === 'create'
        ? 'レコード作成画面'
        : 'レコード編集画面';
  return [
    ...common,
    '',
    `## 現在の画面: ${targetLabel}`,
    '',
    '### アクション: updateRecord (現在のレコードを編集)',
    '```ai-action',
    '{',
    '  "type": "updateRecord",',
    '  "title": "簡潔な見出し (例: 全フィールドにサンプル値を投入)",',
    '  "description": "ユーザーへの説明 (省略可)",',
    '  "fields": {',
    '    "<フィールドコード>": "<新しい値 (文字列)>"',
    '  }',
    '}',
    '```',
    '- フィールド値は **文字列** で記述してください',
    '- 編集対象としないフィールドはオブジェクトに含めないでください',
  ].join('\n');
}

const ACTION_BLOCK_RE = /```ai-action\s*\n([\s\S]*?)```/i;

/**
 * AI 応答テキストから ai-action ブロックを抽出して `{cleaned, action}` を返します。
 * 見つからなければ `action = undefined`、`cleaned` は元テキスト。
 */
export function extractAction(content: string): { cleaned: string; action?: AIAction } {
  const match = ACTION_BLOCK_RE.exec(content);
  if (!match) return { cleaned: content };
  const raw = match[1]?.trim() ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn('[ai-butler] failed to parse ai-action block', error, raw);
    return { cleaned: content };
  }
  if (!parsed || typeof parsed !== 'object') return { cleaned: content };
  const obj = parsed as Record<string, unknown>;
  const title = typeof obj.title === 'string' ? obj.title : undefined;
  const description = typeof obj.description === 'string' ? obj.description : undefined;
  const cleaned = content.replace(ACTION_BLOCK_RE, '').trim();

  if (obj.type === 'updateRecord') {
    if (!obj.fields || typeof obj.fields !== 'object') return { cleaned: content };
    return {
      cleaned,
      action: {
        type: 'updateRecord',
        title,
        description,
        fields: obj.fields as Record<string, string | number | boolean>,
      },
    };
  }
  if (obj.type === 'getRecords') {
    const query = typeof obj.query === 'string' ? obj.query : '';
    const fields = Array.isArray(obj.fields)
      ? (obj.fields.filter((f) => typeof f === 'string') as string[])
      : undefined;
    return {
      cleaned,
      action: { type: 'getRecords', title, description, query, fields },
    };
  }
  if (obj.type === 'updateRecords') {
    if (!Array.isArray(obj.records)) return { cleaned: content };
    const records: { id: string | number; fields: Record<string, string | number | boolean> }[] =
      [];
    for (const r of obj.records) {
      if (!r || typeof r !== 'object') continue;
      const rec = r as Record<string, unknown>;
      const id = rec.id;
      if (typeof id !== 'string' && typeof id !== 'number') continue;
      if (!rec.fields || typeof rec.fields !== 'object') continue;
      records.push({
        id,
        fields: rec.fields as Record<string, string | number | boolean>,
      });
    }
    if (records.length === 0) return { cleaned: content };
    return {
      cleaned,
      action: { type: 'updateRecords', title, description, records },
    };
  }
  return { cleaned: content };
}

/** チャットをリセット */
export const handleChatResetAtom = atom(null, (_, set) => {
  set(chatMessagesAtom, []);
  set(chatInputAtom, '');
  set(attachedFilesAtom, []);
});

/**
 * ファイル内容をテキスト化して返します
 */
async function fileToContext(file: File): Promise<string> {
  const isText =
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    /\.(md|txt|csv|json|xml|yaml|yml|log)$/i.test(file.name);
  if (isText) {
    const text = await file.text();
    return `### 添付ファイル: ${file.name}\n\`\`\`\n${text}\n\`\`\``;
  }
  return `### 添付ファイル: ${file.name} (${file.type || 'unknown'}, ${file.size} bytes)`;
}

function pickCondition(conditions: PluginCondition[], id: string | null): PluginCondition | null {
  if (!id) return null;
  return conditions.find((c) => c.id === id) ?? null;
}

/**
 * 現在のチャット履歴と system プロンプトを組み立てて AI を呼び出し、
 * アシスタントメッセージ (必要に応じて action 付き) を追加します。
 * 送信前に pendingMessage を prepend して、ストリーム中の表示を可能にします。
 */
async function runAITurn(get: Getter, set: Setter): Promise<void> {
  const config = get(pluginConfigAtom);
  const conditions = get(validPluginConditionsAtom);
  const selectedId = get(selectedConditionIdAtom);
  const condition = pickCondition(conditions, selectedId);
  const screen = get(screenKindAtom);

  const pendingMessage: ChatMessage = {
    id: nanoid(),
    role: 'assistant',
    content: '',
    pending: true,
  };
  set(chatMessagesAtom, (prev) => [...prev, pendingMessage]);
  set(isThinkingAtom, true);

  try {
    const history = get(chatMessagesAtom).filter((m) => !m.pending && !m.error);
    const messages: AIChatMessage[] = [];
    const conditionSystem = condition?.systemPrompt?.trim();
    const commonSystem = config.common.systemPrompt?.trim();
    const actionProtocol = buildActionProtocolPrompt(screen);
    const kintoneContext = get(kintoneContextAtom)?.trim();
    const systemPrompt = [commonSystem, conditionSystem, actionProtocol, kintoneContext]
      .filter(Boolean)
      .join('\n\n');
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    for (const m of history) {
      if (m.role === 'system') continue;
      messages.push({ role: m.role, content: m.content });
    }

    const { content } = await chatComplete(config.common, messages);
    const { cleaned, action } = extractAction(content);

    set(chatMessagesAtom, (prev) =>
      prev.map((m) =>
        m.id === pendingMessage.id
          ? {
              ...m,
              content: cleaned || (action ? '(アクション実行の確認)' : ''),
              pending: false,
              action,
              actionStatus: action ? 'pending' : undefined,
            }
          : m
      )
    );
  } catch (error) {
    console.error('[ai-butler] chat error', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    set(chatMessagesAtom, (prev) =>
      prev.map((m) =>
        m.id === pendingMessage.id
          ? {
              ...m,
              content: `エラーが発生しました: ${errMsg}`,
              pending: false,
              error: true,
            }
          : m
      )
    );
  } finally {
    set(isThinkingAtom, false);
  }
}

/**
 * メッセージを送信し、AI から返信を取得します
 */
export const handleSendChatAtom = atom(null, async (get, set) => {
  const inputText = get(chatInputAtom).trim();
  const files = get(attachedFilesAtom);
  if (!inputText && files.length === 0) {
    return;
  }

  const fileContexts = await Promise.all(files.map((f) => fileToContext(f)));
  const userContent = [inputText, ...fileContexts].filter(Boolean).join('\n\n');

  const userMessage: ChatMessage = {
    id: nanoid(),
    role: 'user',
    content: userContent,
    attachments: files.map((f) => f.name),
  };

  set(chatMessagesAtom, (prev) => [...prev, userMessage]);
  set(chatInputAtom, '');
  set(attachedFilesAtom, []);

  await runAITurn(get, set);
});

function updateMessageStatus(
  prev: ChatMessage[],
  messageId: string,
  patch: Partial<ChatMessage>
): ChatMessage[] {
  return prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m));
}

/**
 * AI のアクション提案を承認して実行します
 */
export const handleApproveActionAtom = atom(null, async (get, set, messageId: string) => {
  const messages = get(chatMessagesAtom);
  const target = messages.find((m) => m.id === messageId);
  if (!target?.action) return;
  const action = target.action;
  const screen = get(screenKindAtom);

  set(chatMessagesAtom, (prev) =>
    updateMessageStatus(prev, messageId, { actionStatus: 'executing', actionError: undefined })
  );

  try {
    if (action.type === 'updateRecord') {
      if (screen === 'create' || screen === 'edit') {
        // DOM 上のレコードを更新 (保存はユーザー操作)
        const { record } = getCurrentRecord();
        if (!record) throw new Error('現在のレコード情報を取得できませんでした');
        const next = { ...record };
        for (const [code, value] of Object.entries(action.fields)) {
          const existing = next[code];
          if (!existing) {
            console.warn('[ai-butler] field not found, skip:', code);
            continue;
          }
          next[code] = { ...existing, value: value == null ? '' : String(value) } as never;
        }
        setCurrentRecord({ record: next });
      } else if (screen === 'detail') {
        const appId = get(currentAppIdAtom);
        const recordId = get(currentRecordIdAtom);
        if (!appId || recordId == null) {
          throw new Error('レコード ID を特定できませんでした');
        }
        const recordPayload: Record<string, { value: string }> = {};
        for (const [code, value] of Object.entries(action.fields)) {
          recordPayload[code] = { value: value == null ? '' : String(value) };
        }
        await updateRecord({
          app: appId,
          id: String(recordId),
          record: recordPayload,
          guestSpaceId: GUEST_SPACE_ID,
        });
      } else {
        throw new Error('現在の画面ではレコード編集アクションを実行できません');
      }
      set(chatMessagesAtom, (prev) =>
        updateMessageStatus(prev, messageId, { actionStatus: 'approved' })
      );
      return;
    }

    if (action.type === 'getRecords') {
      const appId = get(currentAppIdAtom);
      if (!appId) throw new Error('アプリ ID を取得できませんでした');
      const sanitized = (action.query ?? '')
        .replace(/\blimit\s+\d+/gi, '')
        .replace(/\boffset\s+\d+/gi, '')
        .trim();
      const fetched = await getAllRecords({
        app: appId,
        query: sanitized,
        fields: action.fields,
        guestSpaceId: GUEST_SPACE_ID,
      });
      set(chatMessagesAtom, (prev) =>
        updateMessageStatus(prev, messageId, { actionStatus: 'approved' })
      );
      // 取得結果を user メッセージとして AI にフィードバック
      const total = fetched.length;
      const sample = fetched.slice(0, 100);
      const omitted = total - sample.length;
      const json = JSON.stringify(sample, null, 2);
      const feedback: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: [
          `(システム自動送信) getRecords の実行結果: 合計 ${total} 件` +
            (omitted > 0 ? ` (うち先頭 ${sample.length} 件を提示)` : ''),
          'この結果を踏まえ、必要であれば次のアクション (`updateRecords`) を提案してください。不要な場合はアクションを出さずに説明だけを返してください。',
          '',
          '```json',
          json,
          '```',
        ].join('\n'),
        collapsible: true,
        summary: `📥 取得結果 (合計 ${total} 件${omitted > 0 ? `、先頭 ${sample.length} 件をAIに提示` : ''})`,
      };
      set(chatMessagesAtom, (prev) => [...prev, feedback]);
      await runAITurn(get, set);
      return;
    }

    if (action.type === 'updateRecords') {
      const appId = get(currentAppIdAtom);
      if (!appId) throw new Error('アプリ ID を取得できませんでした');
      const payload = action.records.map((r) => {
        const record: Record<string, { value: string }> = {};
        for (const [code, value] of Object.entries(r.fields)) {
          record[code] = { value: value == null ? '' : String(value) };
        }
        return { id: r.id, record };
      });
      await updateAllRecords({
        app: appId,
        records: payload,
        guestSpaceId: GUEST_SPACE_ID,
      });
      set(chatMessagesAtom, (prev) =>
        updateMessageStatus(prev, messageId, { actionStatus: 'approved' })
      );
      // 完了メッセージを追加 (AI へのフィードバックしない)
      set(chatMessagesAtom, (prev) => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: `✅ ${payload.length} 件のレコードを一括更新しました。`,
        },
      ]);
      return;
    }

    throw new Error(`未対応のアクション種別: ${String((action as { type: string }).type)}`);
  } catch (error) {
    console.error('[ai-butler] action execution failed', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    set(chatMessagesAtom, (prev) =>
      updateMessageStatus(prev, messageId, { actionStatus: 'failed', actionError: errMsg })
    );
  }
});

/**
 * AI のアクション提案を拒否します
 */
export const handleRejectActionAtom = atom(null, (_get, set, messageId: string) => {
  set(chatMessagesAtom, (prev) =>
    updateMessageStatus(prev, messageId, { actionStatus: 'rejected' })
  );
});

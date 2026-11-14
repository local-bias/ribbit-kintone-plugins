import { Alert, Button, TextField, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { detectScreen } from '@/lib/ai/chat-availability';
import { toChatItems } from '@/lib/ai/chat-items';
import { canSend, messagesForGeneration, nextPendingApproval } from '@/lib/ai/chat-session';
import { t } from '@/lib/i18n';
import type { AssetScreen } from '@/schema/asset';
import { cssPreview } from '../../chat/css-preview';
import {
  chatConfigAtom,
  chatStateAtom,
  continueChatAtom,
  generationStartedAtAtom,
  inflightMessagesAtom,
  newConversationAtom,
  retryChatAtom,
  sendMessageAtom,
  stopGenerationAtom,
} from '../../states/chat';
import { servicesAtom } from '../../states/launcher';
import { isTrustedEvent } from '../use-edit-action';
import { ApprovalCard } from './approval-card';
import { ChatMessage } from './chat-message';
import { ToolCallCard } from './tool-call-card';

const Root = styled('div')({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});

const ContextBar = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: 2,
  padding: '6px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  fontSize: 12,
  '& details summary': { cursor: 'pointer' },
  '& ul': { margin: '4px 0 0', paddingLeft: 18 },
}));

const Messages = styled('div')({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  display: 'grid',
  alignContent: 'start',
  gap: 10,
  padding: '12px 16px',
});

const Composer = styled('form')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 8,
  padding: '8px 16px 12px',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const SCREEN_KEYS: Record<AssetScreen, Parameters<typeof t>[0]> = {
  index: 'desktop.detail.screen.index',
  detail: 'desktop.detail.screen.detail',
  create: 'desktop.detail.screen.create',
  edit: 'desktop.detail.screen.edit',
};

/** 生成を始めてからの経過秒数(ストリーミングが無いぶん、待っていることを見せる) */
const useElapsedSeconds = (startedAt: number | null): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
};

/** 対象と送信先。何がどこへ送られるかを常に見せる(docs/08-security.md 6章) */
function ChatContext(props: { destination: string }) {
  const services = useAtomValue(servicesAtom);
  const { screen } = detectScreen(location.href);
  return (
    <ContextBar>
      <span>
        {t('desktop.chat.context', services?.target.appId ?? '', t(SCREEN_KEYS[screen]))} ·{' '}
        {t('desktop.chat.destination', props.destination)} ·{' '}
        {t(
          services?.common.sendsRecordToAi
            ? 'desktop.chat.recordSending.on'
            : 'desktop.chat.recordSending.off'
        )}
      </span>
      <details>
        <summary>{t('desktop.chat.dataPolicy')}</summary>
        <ul>
          <li>{t('desktop.chat.dataPolicy.schema')}</li>
          <li>{t('desktop.chat.dataPolicy.dom')}</li>
          <li>{t('desktop.chat.dataPolicy.records')}</li>
          <li>{t('desktop.chat.dataPolicy.code')}</li>
          <li>{t('desktop.chat.dataPolicy.assets')}</li>
          <li>{t('desktop.chat.dataPolicy.user')}</li>
        </ul>
      </details>
    </ContextBar>
  );
}

/** 生成中・中断・失敗の表示 */
function ChatStatus() {
  const state = useAtomValue(chatStateAtom);
  const startedAt = useAtomValue(generationStartedAtAtom);
  const elapsed = useElapsedSeconds(startedAt);
  const continueChat = useSetAtom(continueChatAtom);
  const retry = useSetAtom(retryChatAtom);

  if (state.status === 'generating') {
    return (
      <span role='status' style={{ fontSize: 12 }}>
        {t('desktop.chat.thinking', String(elapsed))}
      </span>
    );
  }
  if (state.status === 'step-limit') {
    return (
      <Alert
        severity='info'
        action={
          <Button
            color='inherit'
            size='small'
            // 続けるとAIの呼び出し(費用)が起きるため、利用者の操作だけを受け付ける
            onClick={(event: MouseEvent) => {
              if (isTrustedEvent(event)) void continueChat();
            }}
          >
            {t('desktop.chat.continue')}
          </Button>
        }
      >
        {t('desktop.chat.stepLimit')}
      </Alert>
    );
  }
  if (state.status === 'error' && state.error !== null) {
    return (
      <Alert
        severity='error'
        action={
          state.error.retryable ? (
            <Button
              color='inherit'
              size='small'
              onClick={(event: MouseEvent) => {
                if (isTrustedEvent(event)) void retry();
              }}
            >
              {t('desktop.chat.retry')}
            </Button>
          ) : undefined
        }
      >
        <div>{t(`desktop.chat.error.${state.error.kind}`)}</div>
        {state.error.detail !== '' && (
          <small style={{ overflowWrap: 'anywhere' }}>{state.error.detail}</small>
        )}
      </Alert>
    );
  }
  if (state.notice !== null) {
    return <Alert severity='warning'>{t(`desktop.chat.notice.${state.notice}`)}</Alert>;
  }
  return null;
}

/**
 * CSSのプレビュー中であることと、解除ボタン
 *
 * パネルを閉じたとき・画面を移ったときにも外す(プレビューは保存していない一時的な見た目)
 */
function PreviewBar() {
  const preview = useSyncExternalStore(cssPreview.subscribe, cssPreview.get);
  // パネルを閉じた・タブを移ったら外す(画面の移動では`cssPreview`が自分で外す)
  useEffect(() => () => cssPreview.clear(), []);
  if (preview === null) return null;
  return (
    <Alert
      severity='info'
      square
      action={
        // 解除は安全側の操作なので、利用者の操作かを問わない
        <Button color='inherit' size='small' onClick={() => cssPreview.clear()}>
          {t('desktop.chat.preview.clear')}
        </Button>
      }
    >
      {t('desktop.chat.preview.active')}
    </Alert>
  );
}

/** IMEが変換中のキー入力で報告する`keyCode`(Safariは確定のEnterで`isComposing`がfalseになる) */
const IME_PROCESS_KEY_CODE = 229;

function ChatInput() {
  const state = useAtomValue(chatStateAtom);
  const send = useSetAtom(sendMessageAtom);
  const stop = useSetAtom(stopGenerationAtom);
  const [text, setText] = useState('');
  const generating = state.status === 'generating';
  const sendable = canSend(state) && text.trim() !== '';

  const submit = () => {
    if (!sendable) return;
    const value = text;
    setText('');
    void send(value);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // IMEの変換確定のEnterでは送らない
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      event.keyCode === IME_PROCESS_KEY_CODE
    ) {
      return;
    }
    event.preventDefault();
    if (!isTrustedEvent(event)) return;
    submit();
  };

  return (
    <Composer
      onSubmit={(event) => {
        event.preventDefault();
        if (isTrustedEvent(event)) submit();
      }}
    >
      <TextField
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('desktop.chat.placeholder')}
        slotProps={{ htmlInput: { 'aria-label': t('desktop.chat.input') } }}
        multiline
        maxRows={6}
        size='small'
        fullWidth
      />
      {generating ? (
        <Tooltip title={t('desktop.chat.stopHint')}>
          <Button variant='outlined' color='inherit' onClick={() => stop()}>
            {t('desktop.chat.stop')}
          </Button>
        </Tooltip>
      ) : (
        <Button variant='contained' type='submit' disabled={!sendable}>
          {t('desktop.chat.send')}
        </Button>
      )}
    </Composer>
  );
}

/**
 * AIと会話してカスタマイズを作るパネル
 *
 * - ストリーミングは使わない。ツールの往復ごとにカードが積まれ、経過秒数を出す
 * - 送信を伴う読み取り(コード本文・レコードの値)と書き込み(登録・変更・削除)は、1件ずつ承認してから行う
 * - CSSのプレビューは、パネルを閉じる・画面を移ると外れる
 *
 * @see docs/06-ui.md 6章
 */
export function ChatPanel() {
  const config = useAtomValue(chatConfigAtom);
  const state = useAtomValue(chatStateAtom);
  const newConversation = useSetAtom(newConversationAtom);
  const endRef = useRef<HTMLDivElement>(null);
  const inflight = useAtomValue(inflightMessagesAtom);
  // 生成中は、終わったstepのツール呼び出しを往復ごとに見せる(履歴には全体が成功してから入る)
  const items = useMemo(
    () =>
      toChatItems([...messagesForGeneration(state), ...inflight], {
        generating: state.status === 'generating',
      }),
    [state, inflight]
  );
  const pending = nextPendingApproval(state);

  // 新しい発言・ツールの結果が積まれたら末尾を見せる
  // biome-ignore lint/correctness/useExhaustiveDependencies: 項目の数と状態が変わったときだけ
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [items.length, state.status]);

  if (config === null || !config.ok) {
    return (
      <Alert severity='info' square>
        {t('desktop.chat.notConfigured')}
      </Alert>
    );
  }
  const destination = new URL(config.endpoint.url).host;

  return (
    <Root>
      <ChatContext destination={destination} />
      <PreviewBar />
      <Messages>
        {items.length === 0 ? (
          <span style={{ fontSize: 12 }}>
            {t('desktop.chat.empty')} {t('desktop.chat.empty.write')}
          </span>
        ) : (
          items.map((item) =>
            item.kind === 'tool' ? (
              <ToolCallCard
                key={item.id}
                toolName={item.toolName}
                input={item.input}
                status={item.status}
                output={item.output}
              />
            ) : (
              <ChatMessage
                key={item.id}
                from={item.kind === 'user' ? 'user' : 'assistant'}
                text={item.text}
              />
            )
          )
        )}
        {pending !== null && (
          <ApprovalCard key={pending.approvalId} approval={pending} destination={destination} />
        )}
        <ChatStatus />
        <div ref={endRef} />
      </Messages>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: 12,
        }}
      >
        <small style={{ alignSelf: 'center' }}>
          {state.usage.inputTokens + state.usage.outputTokens > 0 &&
            t(
              'desktop.chat.usage',
              state.usage.inputTokens.toLocaleString(),
              state.usage.outputTokens.toLocaleString()
            )}
        </small>
        <Button
          size='small'
          disabled={state.messages.length === 0}
          onClick={(event: MouseEvent) => {
            if (isTrustedEvent(event)) newConversation();
          }}
        >
          {t('desktop.chat.newConversation')}
        </Button>
      </div>
      <ChatInput />
    </Root>
  );
}

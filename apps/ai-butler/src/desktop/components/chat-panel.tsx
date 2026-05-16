import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import {
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Fragment, useEffect, useRef } from 'react';
import { validPluginConditionsAtom } from '@/desktop/public-state';
import {
  type AIAction,
  attachedFilesAtom,
  type ChatMessage,
  chatInputAtom,
  chatMessagesAtom,
  chatOpenAtom,
  fileAttachOpenAtom,
  handleApproveActionAtom,
  handleChatResetAtom,
  handleRejectActionAtom,
  handleSendChatAtom,
  isThinkingAtom,
  screenKindAtom,
  selectedConditionIdAtom,
} from '@/desktop/states/chat';

const PanelRoot = styled.div<{ open: boolean }>`
  position: fixed;
  right: 24px;
  bottom: 88px;
  width: min(420px, calc(100vw - 48px));
  height: min(640px, calc(100vh - 120px));
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  font-size: 13px;
  color: #222;
  transform-origin: bottom right;
  transition:
    transform 180ms ease,
    opacity 180ms ease;
  opacity: ${(p) => (p.open ? 1 : 0)};
  transform: ${(p) => (p.open ? 'scale(1)' : 'scale(0.92) translateY(8px)')};
  pointer-events: ${(p) => (p.open ? 'auto' : 'none')};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #3498db, #5fa8d3);
  color: #fff;
  border-radius: 12px 12px 0 0;
`;

const HeaderTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  & .MuiIconButton-root {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Bubble = styled.div<{ role: 'user' | 'assistant' | 'system'; error?: boolean }>`
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  align-self: ${(p) => (p.role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${(p) =>
    p.error
      ? '#fdecea'
      : p.role === 'user'
        ? '#3498db'
        : p.role === 'system'
          ? '#fff5d6'
          : '#ffffff'};
  color: ${(p) => (p.error ? '#a33' : p.role === 'user' ? '#fff' : '#222')};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
`;

const EmptyState = styled.div`
  margin: auto;
  text-align: center;
  color: #888;
  font-size: 12px;
  line-height: 1.6;
`;

const Footer = styled.div`
  padding: 8px 10px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
`;

const FileChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const CollapsibleBubble = styled.details<{ role: 'user' | 'assistant' | 'system' }>`
  align-self: ${(p) => (p.role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 85%;
  background: ${(p) => (p.role === 'user' ? '#eaf3fb' : '#f1f3f5')};
  border: 1px dashed #b0bec5;
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 11px;
  color: #546e7a;

  & > summary {
    cursor: pointer;
    list-style: none;
    padding: 4px 0;
    user-select: none;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  & > summary::-webkit-details-marker {
    display: none;
  }
  & > summary::before {
    content: '▶';
    font-size: 9px;
    transition: transform 120ms ease;
  }
  &[open] > summary::before {
    transform: rotate(90deg);
  }
  & > pre {
    margin: 6px 0 4px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    max-height: 200px;
    overflow: auto;
    font-size: 10px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;

const ActionCard = styled.div<{ status: string }>`
  align-self: stretch;
  margin-top: 4px;
  border-radius: 12px;
  padding: 12px;
  border: 2px solid
    ${(p) =>
      p.status === 'approved'
        ? '#27ae60'
        : p.status === 'rejected'
          ? '#bdc3c7'
          : p.status === 'failed'
            ? '#e74c3c'
            : '#f39c12'};
  background: ${(p) =>
    p.status === 'approved'
      ? 'linear-gradient(135deg, #eafaf1, #d4f0e0)'
      : p.status === 'rejected'
        ? '#f7f7f7'
        : p.status === 'failed'
          ? 'linear-gradient(135deg, #fdecea, #fbd9d4)'
          : 'linear-gradient(135deg, #fff8e1, #ffeec0)'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActionTitle = styled.div`
  font-weight: 700;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ActionDescription = styled.div`
  font-size: 12px;
  color: #555;
  line-height: 1.5;
`;

const ActionFieldsTable = styled.div`
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 8px;
  font-size: 11px;
  font-family: 'Hiragino Sans', 'Noto Sans JP', monospace;
  max-height: 160px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
`;

const ActionFieldKey = styled.div`
  color: #2c3e50;
  font-weight: 600;
`;

const ActionFieldValue = styled.div`
  color: #34495e;
  word-break: break-all;
  white-space: pre-wrap;
`;

const ActionButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  background: ${(p) => (p.primary ? '#f39c12' : '#fff')};
  color: ${(p) => (p.primary ? '#fff' : '#555')};
  border: 1px solid ${(p) => (p.primary ? '#f39c12' : '#ccc')};
  transition: opacity 120ms ease;
  &:hover:not(:disabled) {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionStatusBadge = styled.span<{ status: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${(p) =>
    p.status === 'approved'
      ? '#27ae60'
      : p.status === 'rejected'
        ? '#95a5a6'
        : p.status === 'failed'
          ? '#e74c3c'
          : '#f39c12'};
  color: #fff;
`;

function PromptSelect() {
  const [conditionId, setConditionId] = useAtom(selectedConditionIdAtom);
  const conditions = useAtomValue(validPluginConditionsAtom);
  if (conditions.length === 0) {
    return null;
  }
  return (
    <Select
      size='small'
      value={conditionId ?? ''}
      onChange={(event) => setConditionId(event.target.value || null)}
      displayEmpty
      sx={{ minWidth: 180, fontSize: 12, '& .MuiSelect-select': { py: 0.5 } }}
      MenuProps={{
        sx: { zIndex: 10001 },
        slotProps: { paper: { sx: { fontSize: 12 } } },
      }}
    >
      <MenuItem value=''>
        <em>プロンプトを選択しない</em>
      </MenuItem>
      {conditions.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.name}
        </MenuItem>
      ))}
    </Select>
  );
}

function ActionApprovalCard({ message, action }: { message: ChatMessage; action: AIAction }) {
  const approve = useSetAtom(handleApproveActionAtom);
  const reject = useSetAtom(handleRejectActionAtom);
  const screen = useAtomValue(screenKindAtom);
  const status = message.actionStatus ?? 'pending';
  const statusLabel: Record<string, string> = {
    pending: '承認待ち',
    executing: '実行中…',
    approved: '実行済み',
    rejected: '却下しました',
    failed: '失敗',
  };

  // アクション種別ごとの見出し・説明・コンテンツを構築
  let icon = '⚡';
  let header = 'AI からの実行リクエスト';
  let defaultTitle = 'アクションの実行を提案しています';
  let defaultDescription = '';
  let targetLabel = '';
  let body: React.ReactNode = null;

  if (action.type === 'updateRecord') {
    icon = '✏️';
    header = 'AI がレコードの編集を提案しています';
    defaultTitle = 'レコードを更新します';
    const fields = Object.entries(action.fields);
    defaultDescription = `${fields.length} 個のフィールドを更新します`;
    targetLabel =
      screen === 'detail'
        ? 'レコード詳細画面 (REST API で更新)'
        : screen === 'create'
          ? 'レコード作成画面 (画面上のみ反映)'
          : screen === 'edit'
            ? 'レコード編集画面 (画面上のみ反映)'
            : '不明な画面';
    body = fields.length > 0 && (
      <ActionFieldsTable>
        {fields.map(([key, value]) => (
          <Fragment key={key}>
            <ActionFieldKey>{key}</ActionFieldKey>
            <ActionFieldValue>{String(value)}</ActionFieldValue>
          </Fragment>
        ))}
      </ActionFieldsTable>
    );
  } else if (action.type === 'getRecords') {
    icon = '🔍';
    header = 'AI がレコードの取得を要求しています';
    defaultTitle = 'レコードを取得します';
    defaultDescription = `クエリに一致するレコードをすべて取得します`;
    targetLabel = '一覧画面 (REST API)';
    body = (
      <ActionFieldsTable>
        <ActionFieldKey>query</ActionFieldKey>
        <ActionFieldValue>{action.query || '(空 = 全件)'}</ActionFieldValue>
        {action.fields && action.fields.length > 0 && (
          <>
            <ActionFieldKey>fields</ActionFieldKey>
            <ActionFieldValue>{action.fields.join(', ')}</ActionFieldValue>
          </>
        )}
      </ActionFieldsTable>
    );
  } else if (action.type === 'updateRecords') {
    icon = '📝';
    header = 'AI がレコードの一括更新を提案しています';
    defaultTitle = `${action.records.length} 件のレコードを更新します`;
    defaultDescription = `取得したレコードを基に、サンプルデータで一括更新します`;
    targetLabel = '一覧画面 (REST API: bulkRequest)';
    const previewLimit = 5;
    const preview = action.records.slice(0, previewLimit);
    const omitted = action.records.length - preview.length;
    body = (
      <ActionFieldsTable>
        {preview.map((r) => (
          <Fragment key={String(r.id)}>
            <ActionFieldKey>id: {String(r.id)}</ActionFieldKey>
            <ActionFieldValue>
              {Object.entries(r.fields)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(', ')}
            </ActionFieldValue>
          </Fragment>
        ))}
        {omitted > 0 && (
          <>
            <ActionFieldKey>…</ActionFieldKey>
            <ActionFieldValue>他 {omitted} 件</ActionFieldValue>
          </>
        )}
      </ActionFieldsTable>
    );
  }

  return (
    <ActionCard status={status}>
      <ActionTitle>
        <span>
          {icon} {header}
        </span>
        <ActionStatusBadge status={status}>{statusLabel[status]}</ActionStatusBadge>
      </ActionTitle>
      <ActionDescription>
        <strong>{action.title ?? defaultTitle}</strong>
        <div>{action.description ?? defaultDescription}</div>
        {targetLabel && (
          <div style={{ fontSize: 11, color: '#7f8c8d', marginTop: 4 }}>対象: {targetLabel}</div>
        )}
      </ActionDescription>
      {body}
      {message.actionError && (
        <div style={{ fontSize: 11, color: '#c0392b' }}>エラー: {message.actionError}</div>
      )}
      {status === 'pending' && (
        <ActionButtonRow>
          <ActionButton onClick={() => reject(message.id)}>いいえ</ActionButton>
          <ActionButton primary onClick={() => void approve(message.id)}>
            はい、実行する
          </ActionButton>
        </ActionButtonRow>
      )}
      {status === 'failed' && (
        <ActionButtonRow>
          <ActionButton onClick={() => reject(message.id)}>閉じる</ActionButton>
          <ActionButton primary onClick={() => void approve(message.id)}>
            再試行
          </ActionButton>
        </ActionButtonRow>
      )}
    </ActionCard>
  );
}

function MessageList() {
  const messages = useAtomValue(chatMessagesAtom);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, []);
  return (
    <Body ref={ref}>
      {messages.length === 0 ? (
        <EmptyState>
          <div>👋 AI バトラーへようこそ</div>
          <div>メッセージを入力するか、ファイルをドラッグして開始してください。</div>
        </EmptyState>
      ) : (
        messages.map((m) => (
          <Fragment key={m.id}>
            {m.collapsible ? (
              <CollapsibleBubble role={m.role}>
                <summary>{m.summary ?? '詳細を表示'}</summary>
                <pre>{m.content}</pre>
              </CollapsibleBubble>
            ) : m.content || !m.action ? (
              <Bubble role={m.role} error={m.error}>
                {m.attachments && m.attachments.length > 0 && (
                  <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4 }}>
                    📎 {m.attachments.join(', ')}
                  </div>
                )}
                {m.pending ? (
                  <span style={{ color: '#888' }}>
                    <CircularProgress size={12} sx={{ mr: 1 }} />
                    考え中…
                  </span>
                ) : (
                  m.content
                )}
              </Bubble>
            ) : null}
            {m.action && <ActionApprovalCard message={m} action={m.action} />}
          </Fragment>
        ))
      )}
    </Body>
  );
}

function InputArea() {
  const [input, setInput] = useAtom(chatInputAtom);
  const [files, setFiles] = useAtom(attachedFilesAtom);
  const send = useSetAtom(handleSendChatAtom);
  const thinking = useAtomValue(isThinkingAtom);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void send();
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Footer>
      {files.length > 0 && (
        <FileChips>
          {files.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              size='small'
              label={file.name}
              onDelete={() => removeFile(index)}
              deleteIcon={<DeleteIcon fontSize='small' />}
            />
          ))}
        </FileChips>
      )}
      <InputRow>
        <TextField
          size='small'
          placeholder='メッセージを入力 (⌘+Enter で送信)'
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          fullWidth
          multiline
          maxRows={5}
          disabled={thinking}
        />
        <Tooltip title='送信 (⌘+Enter)'>
          <span>
            <IconButton color='primary' onClick={() => void send()} disabled={thinking}>
              {thinking ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </InputRow>
    </Footer>
  );
}

function ChatPanel() {
  const open = useAtomValue(chatOpenAtom);
  const setOpen = useSetAtom(chatOpenAtom);
  const setFileAttachOpen = useSetAtom(fileAttachOpenAtom);
  const reset = useSetAtom(handleChatResetAtom);

  return (
    <PanelRoot open={open}>
      <Header>
        <HeaderTitle>🤖 AI バトラー</HeaderTitle>
        <HeaderActions>
          <Tooltip title='会話をリセット'>
            <IconButton size='small' onClick={() => reset()}>
              <RestartAltIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip title='閉じる'>
            <IconButton
              size='small'
              onClick={() => {
                setOpen(false);
                setFileAttachOpen(false);
              }}
            >
              <CloseIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </HeaderActions>
      </Header>
      <Toolbar>
        <PromptSelect />
      </Toolbar>
      <MessageList />
      <InputArea />
    </PanelRoot>
  );
}

export default ChatPanel;

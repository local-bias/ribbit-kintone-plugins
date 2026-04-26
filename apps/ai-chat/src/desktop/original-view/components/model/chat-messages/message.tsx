import SendIcon from '@mui/icons-material/Send';
import { Button, TextField } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import type React from 'react';
import { useCallback, useState } from 'react';
import { getHTMLfromMarkdown } from '@/desktop/original-view/action';
import { useChatMessage } from '@/desktop/original-view/contexts/chat-message';
import { handleSendMessageAtom } from '@/desktop/original-view/states/chat-message';
import { loadingAtom, selectedHistoryAtom } from '@/desktop/original-view/states/states';
import { getTextFromMessageContent } from '@/lib/chatgpt';
import type { ChatHistory, MessageAttachment } from '@/lib/static';
import AttachedFile from './file';
import { buildCollapsedPreview } from './utils';

type Props = {
  message: string;
  attachments?: MessageAttachment[];
  cursor?: boolean;
  className?: string;
};

function EditMode() {
  const loading = useAtomValue(loadingAtom);
  const { message, toggleIsEditing } = useChatMessage();
  const [text, setText] = useState(getTextFromMessageContent(message.content));
  const { enqueueSnackbar } = useSnackbar();

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const resend = useAtomCallback(
    useCallback(
      async (get, set) => {
        const messageId = message.id;
        const history = get(selectedHistoryAtom);
        const messages = history?.messages ?? [];
        const index = messages.findIndex((m) => m.id === messageId);
        if (!history || index === -1) {
          enqueueSnackbar('メッセージが見つかりませんでした', { variant: 'error' });
          return;
        }
        // Only edit regular messages (not fact-check messages)
        const originalMessage = messages[index];
        if (!originalMessage) {
          enqueueSnackbar('このメッセージは編集できません', { variant: 'error' });
          return;
        }

        const newMessages: ChatHistory['messages'] = [
          ...messages.slice(0, index),
          { ...originalMessage, content: text },
        ];

        set(selectedHistoryAtom, { ...history, messages: newMessages });
        set(handleSendMessageAtom);

        toggleIsEditing();
      },
      [text, toggleIsEditing, message]
    )
  );

  return (
    <div>
      <TextField multiline value={text} onChange={onTextChange} fullWidth />
      <div className='rad:flex rad:justify-end rad:items-center rad:py-2!'>
        <Button
          variant='contained'
          color='primary'
          startIcon={<SendIcon />}
          disabled={loading || text === ''}
          onClick={resend}
        >
          送信
        </Button>
      </div>
    </div>
  );
}

function ChatMessageComponent({ message, attachments }: Props) {
  const { message: messageObj, isCollapsed, isCollapsible } = useChatMessage();
  const shouldShowCollapsed = isCollapsible && isCollapsed;

  if (!message) {
    return null;
  }

  const text = message;

  const displayText = shouldShowCollapsed ? buildCollapsedPreview(message) : text;

  return (
    <div>
      <div
        dangerouslySetInnerHTML={{ __html: getHTMLfromMarkdown(displayText) }}
        className='rad:[&>_*:first-of-type]:mt-0 rad:[&>_*:last-of-type]:mb-0'
      />
      {(attachments ?? []).map((attachment, i) => (
        <AttachedFile key={i} attachment={attachment} />
      ))}
    </div>
  );
}

export default function ChatMessage(props: Props) {
  const { isEditing } = useChatMessage();

  if (isEditing) {
    return <EditMode />;
  }
  return <ChatMessageComponent {...props} />;
}

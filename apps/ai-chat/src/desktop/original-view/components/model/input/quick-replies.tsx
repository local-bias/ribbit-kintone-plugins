import { handleSendMessageAtom } from '@/desktop/original-view/states/chat-message';
import {
  inputTextAtom,
  loadingAtom,
  quickRepliesAtom,
  selectedHistoryAtom,
} from '@/desktop/original-view/states/states';
import styled from '@emotion/styled';
import { Button, Tooltip } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { nanoid } from 'nanoid';
import { useCallback } from 'react';

const QuickReplyButton = styled(Button)`
  font-size: 14px;
`;

const Container = styled.div`
  padding-left: 64px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: calc(var(--🐸spacing) * 2);
`;

/**
 * AIから提案されたクイックリプライボタンを表示するコンポーネント
 */
export default function QuickReplies() {
  const quickReplies = useAtomValue(quickRepliesAtom);
  const loading = useAtomValue(loadingAtom);
  const setInputText = useSetAtom(inputTextAtom);
  const setQuickReplies = useSetAtom(quickRepliesAtom);

  const handleClick = useAtomCallback(
    useCallback(
      async (get, set, action: string) => {
        const history = get(selectedHistoryAtom);
        if (!history) return;

        // クリックしたらquick repliesをクリア（状態をリセット）
        setInputText('');
        setQuickReplies(null);

        // 履歴にユーザーメッセージを追加
        set(selectedHistoryAtom, {
          ...history,
          messages: [...history.messages, { id: nanoid(), role: 'user', content: action }],
        });

        // メッセージを送信
        await set(handleSendMessageAtom);
      },
      [setInputText, setQuickReplies]
    )
  );

  if (!quickReplies || quickReplies.length === 0) {
    return null;
  }

  return (
    <Container>
      {quickReplies.map((reply, index) => (
        <Tooltip key={index} title={reply.action} arrow placement='top'>
          <QuickReplyButton
            onClick={() => handleClick(reply.action)}
            disabled={loading}
            variant='outlined'
            color='primary'
          >
            {reply.label}
          </QuickReplyButton>
        </Tooltip>
      ))}
    </Container>
  );
}

import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { type FC, useMemo } from 'react';
import { aggregateErrorMessages } from '../kintone-error';
import { DrawerLayout } from './drawer-layout';
import { SummaryBar, type SummaryItem } from './summary-bar';

interface ResultPanelProps {
  /** 取り込もうとした総件数 */
  total: number;
  /** 成功件数 */
  succeeded: number;
  /** 失敗件数 */
  failed: number;
  /** エラーメッセージ一覧（成功時は空配列） */
  errorMessages: string[];
  onClose: () => void;
}

export const ResultPanel: FC<ResultPanelProps> = ({
  total,
  succeeded,
  failed,
  errorMessages,
  onClose,
}) => {
  const items: SummaryItem[] = [
    { label: '取り込み対象', value: total, tone: 'neutral' },
    { label: '成功', value: succeeded, tone: succeeded > 0 ? 'success' : 'neutral' },
    { label: '失敗', value: failed, tone: failed > 0 ? 'error' : 'neutral' },
  ];

  const aggregated = useMemo(() => aggregateErrorMessages(errorMessages), [errorMessages]);

  const footer = (
    <Button variant='contained' onClick={onClose}>
      閉じる
    </Button>
  );

  return (
    <DrawerLayout title='取り込み結果' footer={footer}>
      <SummaryBar items={items} />

      <Box sx={{ mt: 3 }}>
        {failed === 0 ? (
          <Alert severity='success'>すべてのレコードを取り込みました。</Alert>
        ) : (
          <>
            <Alert severity='error' sx={{ mb: 2 }}>
              <AlertTitle>kintoneアプリ側の検証でエラーが発生しました</AlertTitle>
              {succeeded > 0
                ? `${succeeded.toLocaleString()} 件は取り込まれましたが、残り ${failed.toLocaleString()} 件は取り込まれていません。`
                : 'レコードは取り込まれませんでした。エラー内容を確認してください。'}
            </Alert>

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {aggregated.map((entry, index) => (
                <Box
                  key={entry.message}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderTop: index === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <Typography variant='body2' sx={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                    {entry.message}
                  </Typography>
                  {entry.count > 1 && (
                    <Typography variant='body2' color='error.main' sx={{ whiteSpace: 'nowrap' }}>
                      {entry.count.toLocaleString()} 件
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </DrawerLayout>
  );
};

import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { type FC, useMemo } from 'react';
import { t } from '@/lib/i18n';
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
    { label: t('csv.summary.total'), value: total, tone: 'neutral' },
    {
      label: t('csv.summary.succeeded'),
      value: succeeded,
      tone: succeeded > 0 ? 'success' : 'neutral',
    },
    { label: t('csv.summary.failed'), value: failed, tone: failed > 0 ? 'error' : 'neutral' },
  ];

  const aggregated = useMemo(() => aggregateErrorMessages(errorMessages), [errorMessages]);

  const footer = (
    <Button variant='contained' onClick={onClose}>
      {t('csv.common.close')}
    </Button>
  );

  return (
    <DrawerLayout title={t('csv.result.title')} footer={footer}>
      <SummaryBar items={items} />

      <Box sx={{ mt: 3 }}>
        {failed === 0 ? (
          <Alert severity='success'>{t('csv.result.success')}</Alert>
        ) : (
          <>
            <Alert severity='error' sx={{ mb: 2 }}>
              <AlertTitle>{t('csv.result.error.title')}</AlertTitle>
              {succeeded > 0
                ? t('csv.result.error.partial', succeeded.toLocaleString(), failed.toLocaleString())
                : t('csv.result.error.none')}
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
                      {t('csv.result.error.count', entry.count.toLocaleString())}
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

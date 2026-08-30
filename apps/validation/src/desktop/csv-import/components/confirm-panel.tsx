import { Button, Typography } from '@mui/material';
import type { FC } from 'react';
import { t } from '@/lib/i18n';
import { DrawerLayout } from './drawer-layout';
import { SummaryBar } from './summary-bar';

interface ConfirmPanelProps {
  /** 確認メッセージ */
  message: string;
  /** 取り込み件数 */
  count: number;
  onBack: () => void;
  onConfirm: () => void;
}

export const ConfirmPanel: FC<ConfirmPanelProps> = ({ message, count, onBack, onConfirm }) => {
  const footer = (
    <>
      <Button sx={{ mr: 'auto' }} onClick={onBack}>
        {t('csv.common.back')}
      </Button>
      <Button variant='contained' onClick={onConfirm}>
        {t('csv.confirm.submit')}
      </Button>
    </>
  );

  return (
    <DrawerLayout title={t('csv.confirm.title')} footer={footer}>
      <SummaryBar items={[{ label: t('csv.confirm.count'), value: count, tone: 'neutral' }]} />
      <Typography variant='body1' sx={{ mt: 3 }}>
        {message}
      </Typography>
    </DrawerLayout>
  );
};

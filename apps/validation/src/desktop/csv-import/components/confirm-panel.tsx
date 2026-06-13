import { Button, Typography } from '@mui/material';
import type { FC } from 'react';
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
        設定に戻る
      </Button>
      <Button variant='contained' onClick={onConfirm}>
        取り込む
      </Button>
    </>
  );

  return (
    <DrawerLayout title='インポートの確認' footer={footer}>
      <SummaryBar items={[{ label: '取り込み件数', value: count, tone: 'neutral' }]} />
      <Typography variant='body1' sx={{ mt: 3 }}>
        {message}
      </Typography>
    </DrawerLayout>
  );
};

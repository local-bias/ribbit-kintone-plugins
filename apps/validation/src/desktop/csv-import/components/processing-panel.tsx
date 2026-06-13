import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import type { FC } from 'react';
import { DrawerLayout } from './drawer-layout';

interface ProcessingPanelProps {
  total: number;
  done: number;
}

export const ProcessingPanel: FC<ProcessingPanelProps> = ({ total, done }) => {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <DrawerLayout title='取り込み中'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 3,
        }}
      >
        <CircularProgress />
        <Typography variant='body1'>レコードを取り込んでいます…</Typography>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <LinearProgress
            variant={total > 0 ? 'determinate' : 'indeterminate'}
            value={percent}
          />
        </Box>
        <Typography variant='body2' color='text.secondary'>
          {done.toLocaleString()} / {total.toLocaleString()} 件（{percent}%）
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          処理が完了するまでこの画面を閉じないでください。
        </Typography>
      </Box>
    </DrawerLayout>
  );
};

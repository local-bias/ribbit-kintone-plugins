import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import type { FC } from 'react';
import { t } from '@/lib/i18n';
import { DrawerLayout } from './drawer-layout';

interface ProcessingPanelProps {
  total: number;
  done: number;
}

export const ProcessingPanel: FC<ProcessingPanelProps> = ({ total, done }) => {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <DrawerLayout title={t('csv.processing.title')}>
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
        <Typography variant='body1'>{t('csv.processing.message')}</Typography>
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          <LinearProgress variant={total > 0 ? 'determinate' : 'indeterminate'} value={percent} />
        </Box>
        <Typography variant='body2' color='text.secondary'>
          {t(
            'csv.processing.progress',
            done.toLocaleString(),
            total.toLocaleString(),
            String(percent)
          )}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {t('csv.processing.caution')}
        </Typography>
      </Box>
    </DrawerLayout>
  );
};

import { Box, Typography } from '@mui/material';
import type { FC } from 'react';

export type SummaryTone = 'neutral' | 'success' | 'error' | 'warning';

export interface SummaryItem {
  label: string;
  value: number;
  tone: SummaryTone;
}

const TONE_COLOR: Record<SummaryTone, string> = {
  neutral: 'text.primary',
  success: 'success.main',
  error: 'error.main',
  warning: 'warning.main',
};

/** 件数サマリ（対象/成功/エラーなど）を横並びのカードで表示します。 */
export const SummaryBar: FC<{ items: SummaryItem[] }> = ({ items }) => (
  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
    {items.map((item) => (
      <Box
        key={item.label}
        sx={{
          minWidth: 120,
          px: 2,
          py: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant='caption' color='text.secondary' component='div'>
          {item.label}
        </Typography>
        <Typography variant='h5' component='div' sx={{ color: TONE_COLOR[item.tone], fontWeight: 700 }}>
          {item.value.toLocaleString()}
        </Typography>
      </Box>
    ))}
  </Box>
);

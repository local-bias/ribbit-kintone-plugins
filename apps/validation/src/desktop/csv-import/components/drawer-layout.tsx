import { Box, Typography } from '@mui/material';
import type { FC, ReactNode } from 'react';

interface DrawerLayoutProps {
  title: string;
  /** フッターの操作要素（省略時はフッター自体を表示しない） */
  footer?: ReactNode;
  children: ReactNode;
}

/** ドロワー内の各ステップで共通利用するヘッダー／本文／フッターのレイアウト。 */
export const DrawerLayout: FC<DrawerLayoutProps> = ({ title, footer, children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant='h6'>{title}</Typography>
    </Box>

    <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>{children}</Box>

    {footer && (
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        {footer}
      </Box>
    )}
  </Box>
);

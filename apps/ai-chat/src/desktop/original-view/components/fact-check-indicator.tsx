import { t } from '@/lib/i18n';
import { Loader } from '@konomi-app/ui-react';
import BlockIcon from '@mui/icons-material/Block';
import GppBadIcon from '@mui/icons-material/GppBad';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import PolicyIcon from '@mui/icons-material/Policy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Box, Tooltip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { factCheckStateAtom } from '../states/states';
import FactCheckTooltip from './fact-check-tooltip';

interface Props {
  messageId: string;
}

export default function FactCheckIndicator({ messageId }: Props) {
  const factCheckState = useAtomValue(factCheckStateAtom);
  const state = factCheckState[messageId];

  if (!state) return null;

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  };

  if (state.status === 'checking') {
    return (
      <Tooltip title={t('factCheck.status.checking')}>
        <Box
          sx={{
            ...baseStyles,
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute' }}>
            <Loader size={24} />
          </Box>
          <PolicyIcon sx={{ fontSize: 14, color: '#1e3a5f', opacity: 0.7 }} />
        </Box>
      </Tooltip>
    );
  }

  if (state.status === 'error') {
    return (
      <Tooltip title={`${t('factCheck.status.error')}: ${state.error}`}>
        <Box
          sx={{
            ...baseStyles,
            '&:hover': { bgcolor: 'rgba(183, 28, 28, 0.15)' },
          }}
        >
          <GppBadIcon sx={{ fontSize: 20, color: '#b71c1c' }} />
        </Box>
      </Tooltip>
    );
  }

  const result = state.result!;

  const statusConfig = {
    trusted: {
      icon: <VerifiedUserIcon sx={{ fontSize: 20 }} />,
      bgcolor: 'rgba(27, 94, 32, 0.08)',
      borderColor: 'rgba(27, 94, 32, 0.5)',
      hoverBg: 'rgba(27, 94, 32, 0.15)',
      iconColor: '#1b5e20',
    },
    caution: {
      icon: <GppMaybeIcon sx={{ fontSize: 20 }} />,
      bgcolor: 'rgba(245, 124, 0, 0.08)',
      borderColor: 'rgba(245, 124, 0, 0.5)',
      hoverBg: 'rgba(245, 124, 0, 0.15)',
      iconColor: '#e65100',
    },
    inaccurate: {
      icon: <GppBadIcon sx={{ fontSize: 20 }} />,
      bgcolor: 'rgba(183, 28, 28, 0.08)',
      borderColor: 'rgba(183, 28, 28, 0.5)',
      hoverBg: 'rgba(183, 28, 28, 0.15)',
      iconColor: '#b71c1c',
    },
    skipped: {
      icon: <BlockIcon sx={{ fontSize: 20 }} />,
      bgcolor: 'rgba(97, 97, 97, 0.08)',
      borderColor: 'rgba(97, 97, 97, 0.4)',
      hoverBg: 'rgba(97, 97, 97, 0.15)',
      iconColor: '#616161',
    },
  };

  const config = statusConfig[state.status as keyof typeof statusConfig];

  return (
    <Tooltip
      title={<FactCheckTooltip result={result} />}
      placement='top'
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            p: 0,
            boxShadow: 'none',
            maxWidth: 'none',
          },
        },
      }}
    >
      <Box
        sx={{
          ...baseStyles,
          color: config.iconColor,
          '&:hover': {
            bgcolor: config.hoverBg,
            transform: 'scale(1.05)',
          },
        }}
      >
        {config.icon}
      </Box>
    </Tooltip>
  );
}

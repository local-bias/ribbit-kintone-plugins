import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtomValue } from '@repo/jotai';
import { forwardRef, type MouseEventHandler } from 'react';
import { LAUNCHER_Z_INDEX } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { summarizeLauncher } from '@/lib/launcher-status';
import { runtimeViewAtom } from '../states/launcher';

/** 起動ボタンの直径(操作領域は44px以上。docs/06-ui.md 10章) */
const SIZE = 56;

const Button = styled('button')<{ 'data-expanded': boolean; 'data-safe-mode': boolean }>(
  ({ theme }) => ({
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: LAUNCHER_Z_INDEX,
    boxSizing: 'border-box',
    width: SIZE,
    height: SIZE,
    margin: 0,
    padding: 0,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '50%',
    background: theme.palette.background.paper,
    boxShadow: theme.shadows[4],
    fontSize: 26,
    lineHeight: 1,
    cursor: 'pointer',
    opacity: 0.45,
    transition: 'opacity 160ms ease, box-shadow 160ms ease',
    '&:hover, &:focus-visible, &[data-expanded="true"]': {
      opacity: 1,
      boxShadow: theme.shadows[8],
    },
    '&:focus-visible': {
      outline: `3px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
    '&[data-safe-mode="true"]': { filter: 'grayscale(1)' },
    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
    '@media (max-width: 480px)': { right: 16, bottom: 16 },
  })
);

const Badge = styled('span')(({ theme }) => ({
  position: 'absolute',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 6px',
  boxSizing: 'border-box',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  color: theme.palette.common.white,
}));

const CountBadge = styled(Badge)(({ theme }) => ({
  top: -4,
  right: -4,
  background: theme.palette.primary.main,
}));

const AlertBadge = styled(Badge)<{ 'data-tone': 'error' | 'warning' }>(({ theme }) => ({
  bottom: -4,
  right: -4,
  background: theme.palette.error.main,
  '&[data-tone="warning"]': { background: theme.palette.warning.dark },
}));

type Props = {
  expanded: boolean;
  menuOpen: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

/**
 * 画面右下に常時見える起動ボタン
 *
 * 状態は色だけで伝えず、記号と読み上げ用の文言を添える(docs/06-ui.md 10章)
 */
export const LauncherButton = forwardRef<HTMLButtonElement, Props>(function LauncherButton(
  { expanded, menuOpen, onClick },
  ref
) {
  const view = useAtomValue(runtimeViewAtom);
  const summary = summarizeLauncher({
    phase: view.phase,
    appliedIds: new Set([...view.applied.js, ...view.applied.css]),
    problemAssetIds: new Set(view.problems.keys()),
  });
  const states = [
    summary.safeMode ? t('desktop.launcher.safeMode') : null,
    summary.appliedCount > 0 ? t('desktop.launcher.applied', String(summary.appliedCount)) : null,
    summary.notLoaded ? t('desktop.launcher.notLoaded') : null,
    summary.hasProblems ? t('desktop.launcher.problems') : null,
  ].filter((state): state is string => state !== null);
  const label = [t('desktop.launcher.open'), ...states].join(' / ');

  return (
    <Tooltip title={label} placement='left'>
      <Button
        ref={ref}
        type='button'
        aria-label={label}
        aria-haspopup='menu'
        aria-expanded={menuOpen}
        data-expanded={expanded}
        data-safe-mode={summary.safeMode}
        onClick={onClick}
      >
        <span aria-hidden='true'>🐸</span>
        {summary.appliedCount > 0 && (
          <CountBadge aria-hidden='true'>{summary.appliedCount}</CountBadge>
        )}
        {summary.notLoaded ? (
          <AlertBadge aria-hidden='true' data-tone='warning'>
            ⏱
          </AlertBadge>
        ) : (
          summary.hasProblems && (
            <AlertBadge aria-hidden='true' data-tone='error'>
              ⚠
            </AlertBadge>
          )
        )}
      </Button>
    </Tooltip>
  );
});

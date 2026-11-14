import { Alert, Button } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { buildNormalModeUrl } from '@/lib/browser-storage';
import { t } from '@/lib/i18n';
import { describeLoadError } from '../diagnostic-text';
import { pendingReloadIdsAtom, runtimeViewAtom } from '../states/launcher';

const reloadPage = () => location.reload();

/**
 * パネル上部に出す、このページの状態(セーフモード・読み込めなかった・再読み込みが必要)
 *
 * @see docs/05-runtime.md 2-1章・9章、docs/06-ui.md 5章
 */
export function StatusBanner() {
  const view = useAtomValue(runtimeViewAtom);
  const pendingReload = useAtomValue(pendingReloadIdsAtom);
  const reloadButton = (
    <Button color='inherit' size='small' onClick={reloadPage}>
      {t('desktop.panel.reload')}
    </Button>
  );

  if (view.phase === 'safe-mode') {
    return (
      <Alert
        severity='info'
        square
        action={
          <Button color='inherit' size='small' href={buildNormalModeUrl(location.href)}>
            {t('desktop.notice.exitSafeMode')}
          </Button>
        }
      >
        {t('desktop.notice.safeMode')}
      </Alert>
    );
  }
  if (view.phase === 'failed' && view.loadError !== null) {
    return (
      <Alert severity='error' square action={reloadButton}>
        {describeLoadError(view.loadError)}
      </Alert>
    );
  }
  if (view.phase === 'timed-out') {
    return (
      <Alert severity='warning' square action={reloadButton}>
        {t('desktop.notice.timeout')}
      </Alert>
    );
  }
  if (pendingReload.size > 0) {
    return (
      <Alert severity='info' square action={reloadButton}>
        {t('desktop.panel.reloadRequired')}
      </Alert>
    );
  }
  return null;
}

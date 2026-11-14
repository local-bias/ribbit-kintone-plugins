import { isGuestSpace } from '@konomi-app/kintone-utilities';
import { JotaiAppSelect } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Alert } from '@mui/material';
import { currentAppIdAtom, useAtom, useAtomValue, useSetAtom } from '@repo/jotai';
import { kintoneAppsAtom } from '@/config/states/kintone';
import { commonPropertyAtoms } from '@/config/states/plugin';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import { AsyncFormField } from './async-form-field';

function AssetAppSelect() {
  const apps = useAtomValue(kintoneAppsAtom);
  const [assetAppId, setAssetAppId] = useAtom(commonPropertyAtoms.assetAppId);
  const setAssetAppSpaceId = useSetAtom(commonPropertyAtoms.assetAppSpaceId);

  /** ゲストスペースのアプリなら、REST APIの呼び出しに使うゲストスペースIDも記録する */
  const handleChange = async (appId: string) => {
    setAssetAppId(appId);
    const app = apps.find((candidate) => candidate.appId === appId);
    let guestSpaceId = '';
    try {
      guestSpaceId = app?.spaceId && (await isGuestSpace(appId)) ? app.spaceId : '';
    } catch (error) {
      if (isDev) {
        console.warn('[ai-customize] Failed to detect guest space', error);
      }
    }
    setAssetAppSpaceId(guestSpaceId);
  };

  return (
    <JotaiAppSelect
      appsAtom={kintoneAppsAtom}
      appId={assetAppId}
      onChange={(appId) => void handleChange(appId)}
      label={t('config.assetApp.label')}
      placeholder={t('config.assetApp.placeholder')}
      sx={{ width: 420, maxWidth: '100%' }}
    />
  );
}

function AssetAppWarnings() {
  const currentAppId = useAtomValue(currentAppIdAtom);
  const assetAppId = useAtomValue(commonPropertyAtoms.assetAppId);
  const assetAppSpaceId = useAtomValue(commonPropertyAtoms.assetAppSpaceId);
  if (assetAppId === '') {
    return null;
  }
  const isSelf = assetAppId === String(currentAppId);
  const isGuestMismatch = assetAppSpaceId !== (GUEST_SPACE_ID ?? '');
  return (
    <>
      {isSelf && <Alert severity='warning'>{t('config.assetApp.selfWarning')}</Alert>}
      {isGuestMismatch && <Alert severity='warning'>{t('config.assetApp.guestWarning')}</Alert>}
    </>
  );
}

export default function AssetAppSection() {
  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.assetApp.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.assetApp.description')}</PluginFormDescription>
      <div className='grid gap-4'>
        <AsyncFormField label={t('config.assetApp.label')}>
          <AssetAppSelect />
        </AsyncFormField>
        <AssetAppWarnings />
      </div>
    </PluginFormSection>
  );
}

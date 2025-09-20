import {
  FIELD_TYPES_NOT_SUPPORTED,
  filterUnsupportedFieldTypes,
  PLUGIN_NAME,
} from '@/lib/constants';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { createConfig, migrateConfig, restorePluginConfig } from '@/lib/plugin';
import { PluginConfig, PluginFieldType } from '@/schema/plugin-config';
import { kintoneAPI, onFileLoad, storePluginConfig } from '@konomi-app/kintone-utilities';
import {
  appFormFieldsAtom,
  currentAppIdAtom,
  handleLoadingEndAtom,
  handleLoadingStartAtom,
  usePluginAtoms,
} from '@repo/jotai';
import { produce } from 'immer';
import { atom } from 'jotai';
import { eagerAtom } from 'jotai-eager';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { kintoneAppsAtom, kintoneSpacesAtom } from './kintone';

export const pluginConfigAtom = atom<PluginConfig>(restorePluginConfig());

export const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  enqueueSnackbar(t('common.config.toast.reset'), { variant: 'success' });
});

export const {
  pluginConditionsAtom,
  hasMultipleConditionsAtom,
  conditionsLengthAtom,
  selectedConditionIdAtom,
  selectedConditionAtom,
  getConditionPropertyAtom,
  isConditionIdUnselectedAtom,
} = usePluginAtoms(pluginConfigAtom, {});

export const pluginConditionModeAtom = getConditionPropertyAtom('mode');
export const dstAppIdAtom = getConditionPropertyAtom('dstAppId');
export const dstGuestSpaceIdAtom = getConditionPropertyAtom('dstGuestSpaceId');
export const buttonLabelAtom = getConditionPropertyAtom('buttonLabel');
export const appConnectionsAtom = getConditionPropertyAtom('appConnections');
export const fieldsAtom = getConditionPropertyAtom('fields');
export const usersAtom = getConditionPropertyAtom('users');

export type KintoneFieldPropertyWithAppInfo = kintoneAPI.FieldProperty & {
  appId: string | number;
  appName: string | null;
  guestSpaceId?: string;
};

const primitiveSrcAppFormFieldsAtom = eagerAtom<KintoneFieldPropertyWithAppInfo[]>((get) => {
  const appConnections = get(appConnectionsAtom);
  const currentAppId = get(currentAppIdAtom);

  const results: KintoneFieldPropertyWithAppInfo[] = [];

  const currentAppFormFields = get(
    appFormFieldsAtom({ app: currentAppId, guestSpaceId: GUEST_SPACE_ID, preview: true })
  ).map((field) => ({
    ...field,
    appId: currentAppId,
    appName: null,
    guestSpaceId: GUEST_SPACE_ID,
  }));

  results.push(...currentAppFormFields);

  if (!appConnections?.length) {
    return results;
  }

  const apps = get(kintoneAppsAtom);
  const spaces = get(kintoneSpacesAtom);

  for (const connection of appConnections) {
    const app = apps.find((a) => a.appId === connection.appId);
    if (!app) {
      continue;
    }
    const space = spaces.find((s) => s.id === app.spaceId);
    const guestSpaceId = space?.isGuest ? space.id : undefined;
    const formFields = get(appFormFieldsAtom({ app: connection.appId, guestSpaceId })).map(
      (field) => ({ ...field, appId: connection.appId, appName: app.name, guestSpaceId })
    );
    results.push(...formFields);
  }
  return results;
});

export const srcAppFormFieldsAtom = eagerAtom((get) => {
  return get(primitiveSrcAppFormFieldsAtom).filter(filterUnsupportedFieldTypes);
});

export const dstAppFormFieldsAtom = eagerAtom((get) => {
  const dstAppId = get(dstAppIdAtom);
  if (!dstAppId) {
    return [];
  }
  const space = get(dstAppSpaceAtom);
  return get(
    appFormFieldsAtom({
      app: dstAppId,
      guestSpaceId: space?.isGuest ? space.id : undefined,
    })
  ).filter(filterUnsupportedFieldTypes);
});

export const handleFieldTypeChangeAtom = atom(
  null,
  (_, set, rowIndex: number, value: PluginFieldType) => {
    set(fieldsAtom, (current) =>
      produce(current, (draft) => {
        const targetField = draft[rowIndex];
        invariant(targetField, 'フィールドが見つかりません');
        targetField.type = value;
      })
    );
  }
);

export const handleFixedValueChangeAtom = atom(null, (_, set, rowIndex: number, value: string) => {
  set(fieldsAtom, (current) =>
    produce(current, (draft) => {
      const targetField = draft[rowIndex];
      invariant(targetField, 'フィールドが見つかりません');
      targetField.fixedValue = value;
    })
  );
});

export const handleSrcFieldChangeAtom = atom(
  null,
  (_, set, rowIndex: number, value: KintoneFieldPropertyWithAppInfo | null) => {
    set(fieldsAtom, (current) =>
      produce(current, (draft) => {
        const targetField = draft[rowIndex];
        invariant(targetField, 'フィールドが見つかりません');
        if (value === null) {
          targetField.srcAppId = '';
          targetField.srcFieldCode = '';
        } else {
          targetField.srcAppId = String(value.appId);
          targetField.srcFieldCode = value.code;
        }
      })
    );
  }
);

export const handleDstFieldChangeAtom = atom(
  null,
  (_, set, rowIndex: number, value: kintoneAPI.FieldProperty | null) => {
    set(fieldsAtom, (current) =>
      produce(current, (draft) => {
        const targetField = draft[rowIndex];
        invariant(targetField, 'フィールドが見つかりません');
        if (value === null) {
          targetField.dstFieldCode = '';
        } else {
          targetField.dstFieldCode = value.code;
        }
      })
    );
  }
);

export const handlePluginConditionDeleteAtom = atom(null, (get, set) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConditionsAtom, (prev) =>
    prev.filter((condition) => condition.id !== selectedConditionId)
  );
  set(selectedConditionIdAtom, null);
  enqueueSnackbar(t('common.config.toast.onConditionDelete'), { variant: 'success' });
});

export const updatePluginConfig = atom(null, (get, set, actionComponent: ReactNode) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    storePluginConfig(pluginConfig, {
      callback: () => true,
      flatProperties: ['conditions'],
      debug: true,
    });
    enqueueSnackbar(t('common.config.toast.save'), {
      variant: 'success',
      action: actionComponent,
    });
  } finally {
    set(handleLoadingEndAtom);
  }
});

/**
 * jsonファイルを読み込み、プラグインの設定情報をインポートします
 */
export const importPluginConfigAtom = atom(
  null,
  async (_, set, event: ChangeEvent<HTMLInputElement>) => {
    try {
      set(handleLoadingStartAtom);
      const { files } = event.target;
      invariant(files?.length, 'ファイルが見つかりませんでした');
      const [file] = Array.from(files);
      const fileEvent = await onFileLoad(file!);
      const text = (fileEvent.target?.result ?? '') as string;
      set(pluginConfigAtom, migrateConfig(JSON.parse(text)));
      enqueueSnackbar(t('common.config.toast.import'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('common.config.error.import'), { variant: 'error' });
      throw error;
    } finally {
      set(handleLoadingEndAtom);
    }
  }
);

/**
 * プラグインの設定情報をjsonファイルとしてエクスポートします
 */
export const exportPluginConfigAtom = atom(null, (get, set) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    const blob = new Blob([JSON.stringify(pluginConfig, null)], {
      type: 'application/json',
    });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${PLUGIN_NAME}-config.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    enqueueSnackbar(t('common.config.toast.export'), { variant: 'success' });
  } catch (error) {
    enqueueSnackbar(t('common.config.error.export'), { variant: 'error' });
    throw error;
  } finally {
    set(handleLoadingEndAtom);
  }
});

export const handleDstAppIdChangeAtom = atom(null, async (get, set, value: string) => {
  set(dstAppIdAtom, value);
  const space = await get(dstAppSpaceAtom);
  set(dstGuestSpaceIdAtom, space?.isGuest ? space.id : undefined);
});

export const dstAppSpaceAtom = eagerAtom((get) => {
  const dstAppId = get(dstAppIdAtom);
  if (!dstAppId) {
    return null;
  }
  const allApps = get(kintoneAppsAtom);
  const app = allApps.find((a) => a.appId === dstAppId);
  if (!app || !app.spaceId) {
    return null;
  }
  const spaces = get(kintoneSpacesAtom);
  return spaces.find((s) => s.id === app.spaceId) ?? null;
});

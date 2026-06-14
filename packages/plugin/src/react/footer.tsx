import {
  PluginConfigExportButton,
  PluginConfigImportButton,
  PluginConfigResetButton,
  PluginFooter,
} from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { loadingAtom, useAtomValue, useSetAtom, type WritableAtom } from '@repo/jotai';
import type { TranslationFunction } from '@repo/utils';
import { type ChangeEvent, type ReactNode, useCallback } from 'react';

type ResetAtom = WritableAtom<null, [], void>;
type ExportAtom = WritableAtom<null, [], void>;
type ImportAtom = WritableAtom<null, [ChangeEvent<HTMLInputElement>], unknown>;
type UpdateAtom = WritableAtom<null, [ReactNode], unknown>;

type ConfigFooterProps = {
  t: TranslationFunction;
  resetAtom: ResetAtom;
  exportAtom: ExportAtom;
  importAtom: ImportAtom;
  updateAtom: UpdateAtom;
};

function ConfigResetButton({ resetAtom }: Pick<ConfigFooterProps, 'resetAtom'>) {
  const reset = useSetAtom(resetAtom);
  return <PluginConfigResetButton reset={reset} />;
}

function ConfigExportButton({ exportAtom }: Pick<ConfigFooterProps, 'exportAtom'>) {
  const loading = useAtomValue(loadingAtom);
  const exportPluginConfig = useSetAtom(exportAtom);
  return <PluginConfigExportButton loading={loading} onExportButtonClick={exportPluginConfig} />;
}

function ConfigImportButton({ importAtom }: Pick<ConfigFooterProps, 'importAtom'>) {
  const loading = useAtomValue(loadingAtom);
  const importPluginConfig = useSetAtom(importAtom);
  return <PluginConfigImportButton loading={loading} onImportButtonClick={importPluginConfig} />;
}

function SaveButton(props: {
  t: TranslationFunction;
  updateAtom: UpdateAtom;
  backToPluginList: () => void;
}) {
  const { t, updateAtom, backToPluginList } = props;
  const loading = useAtomValue(loadingAtom);
  const savePluginConfig = useSetAtom(updateAtom);

  return (
    <Button
      variant='contained'
      color='primary'
      disabled={loading}
      onClick={() =>
        savePluginConfig(
          <Button color='inherit' size='small' variant='outlined' onClick={backToPluginList}>
            {t('common.config.button.return')}
          </Button>
        )
      }
      startIcon={loading ? <CircularProgress color='inherit' size={20} /> : <SaveIcon />}
    >
      {t('common.config.button.save')}
    </Button>
  );
}

function BackToPluginListButton(props: { t: TranslationFunction; backToPluginList: () => void }) {
  const { t, backToPluginList } = props;
  const loading = useAtomValue(loadingAtom);
  return (
    <Button
      variant='contained'
      color='inherit'
      disabled={loading}
      onClick={backToPluginList}
      startIcon={
        loading ? <CircularProgress color='inherit' size={20} /> : <SettingsBackupRestoreIcon />
      }
    >
      {t('common.config.button.return')}
    </Button>
  );
}

/**
 * プラグイン設定画面のフッターです。
 * 設定の保存・一覧へ戻る・エクスポート・インポート・リセットの各操作を提供します。
 *
 * 操作対象のatomは{@link createPluginConfigStore}が生成したものを渡してください。
 */
export function ConfigFooter(props: ConfigFooterProps) {
  const { t, resetAtom, exportAtom, importAtom, updateAtom } = props;
  const backToPluginList = useCallback(() => history.back(), []);

  return (
    <PluginFooter className='py-2'>
      <div className='flex items-center gap-4'>
        <SaveButton t={t} updateAtom={updateAtom} backToPluginList={backToPluginList} />
        <BackToPluginListButton t={t} backToPluginList={backToPluginList} />
      </div>
      <div className='flex items-center gap-4'>
        <ConfigExportButton exportAtom={exportAtom} />
        <ConfigImportButton importAtom={importAtom} />
        <ConfigResetButton resetAtom={resetAtom} />
      </div>
    </PluginFooter>
  );
}

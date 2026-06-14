import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { type PrimitiveAtom, useAtom, type WritableAtom } from '@repo/jotai';
import type { TranslationFunction } from '@repo/utils';
import { useSnackbar } from 'notistack';
import type { ReactNode } from 'react';

type ConditionBase = { id: string };

type ConfigSidebarProps<Condition extends ConditionBase> = {
  t: TranslationFunction;
  /** {@link createPluginConfigStore}が生成した条件リストのatom */
  pluginConditionsAtom: PrimitiveAtom<Condition[]>;
  /** {@link createPluginConfigStore}が生成した選択中条件IDのatom */
  // biome-ignore lint/suspicious/noExplicitAny: RESETシンボルを含むsetterシグネチャを緩く受け取るため
  selectedConditionIdAtom: WritableAtom<string | null, [any], void>;
  /** 新しい条件を生成する関数 */
  getNewCondition: () => Condition;
  /** 貼り付け時に条件が有効かどうかを検証する関数 */
  isPluginConditionMet: (condition: unknown) => boolean;
  /** 共通設定タブを表示するかどうか。既定値は`true` */
  commonTab?: boolean;
  /** 各条件タブのラベルを描画するコンポーネント */
  labelComponent?: (params: { condition: Condition; index: number }) => ReactNode;
};

/**
 * プラグイン設定画面のサイドバーです。
 * 設定条件の選択・追加・削除・コピー・貼り付けを提供します。
 *
 * 操作対象のatomは{@link createPluginConfigStore}が生成したものを渡してください。
 */
export function ConfigSidebar<Condition extends ConditionBase>(
  props: ConfigSidebarProps<Condition>
) {
  const {
    t,
    pluginConditionsAtom,
    selectedConditionIdAtom,
    getNewCondition,
    isPluginConditionMet,
    commonTab = true,
    labelComponent,
  } = props;

  const { enqueueSnackbar } = useSnackbar();
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);

  const defaultLabel = (params: { condition: Condition; index: number }) => {
    const { index } = params;
    return (
      <div>
        <div className='text-[11px] leading-4 text-gray-400'>{`${t('common.config.sidebar.tab.label')}${index + 1}`}</div>
        <div>{t('common.config.sidebar.tab.defaultLabel')}</div>
      </div>
    );
  };

  const onSelectedConditionChange = (condition: Condition | null) => {
    setSelectedConditionId(condition?.id ?? null);
  };

  const onConditionDelete = () => {
    enqueueSnackbar(t('common.config.toast.onConditionDelete'), { variant: 'success' });
  };

  return (
    <BundledSidebar
      conditions={conditions}
      setConditions={setConditions}
      getNewCondition={getNewCondition}
      labelComponent={labelComponent ?? defaultLabel}
      onSelectedConditionChange={onSelectedConditionChange}
      selectedConditionId={selectedConditionId}
      commonTab={commonTab}
      onConditionDelete={onConditionDelete}
      context={{
        onCopy: () => {
          enqueueSnackbar(t('common.config.sidebar.context.onCopy'), { variant: 'success' });
        },
        onPaste: () => {
          enqueueSnackbar(t('common.config.sidebar.context.onPaste'), { variant: 'success' });
          return null;
        },
        onPasteValidation: (condition) => isPluginConditionMet(condition),
        onPasteValidationError: () => {
          enqueueSnackbar(t('common.config.sidebar.context.onPasteFailure'), { variant: 'error' });
        },
      }}
    />
  );
}

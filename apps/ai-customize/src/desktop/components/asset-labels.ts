import type { AssetProblem } from '@/lib/diagnostics';
import { t } from '@/lib/i18n';
import type { Asset, AssetPermission } from '@/schema/asset';

/**
 * 一覧と詳細で共通に使う表示用の文言
 */

export const assetTitle = (asset: Pick<Asset, 'title'>): string =>
  asset.title.trim() === '' ? t('desktop.row.untitled') : asset.title;

export type PermissionChip = { label: string; caution: boolean };

type ChipFactory = (asset: Pick<Asset, 'externalUrls'>) => PermissionChip;

const PERMISSION_CHIPS: Record<AssetPermission, ChipFactory> = {
  post: () => ({ label: t('desktop.row.permission.post'), caution: false }),
  put: () => ({ label: t('desktop.row.permission.put'), caution: false }),
  delete: () => ({ label: t('desktop.row.permission.delete'), caution: false }),
  'external-listed': (asset) => ({
    label: t('desktop.row.permission.externalListed', String(asset.externalUrls.length)),
    caution: false,
  }),
  // 任意の送信先・迂回を許すため、注意の見た目にする
  'external-all': () => ({ label: t('desktop.row.permission.externalAll'), caution: true }),
  unrestricted: () => ({ label: t('desktop.row.permission.unrestricted'), caution: true }),
};

/** 付与済みの権限のチップ。読み取りは常に許可なので出さない */
export const permissionChips = (
  asset: Pick<Asset, 'permissions' | 'externalUrls'>
): PermissionChip[] => asset.permissions.map((permission) => PERMISSION_CHIPS[permission](asset));

export const problemLabel = (problem: AssetProblem): string => {
  switch (problem) {
    case 'failed':
      return t('desktop.row.problem.failed');
    case 'denied':
      return t('desktop.row.problem.denied');
    case 'blocked':
      return t('desktop.row.problem.blocked');
    case 'suspended':
      return t('desktop.row.problem.suspended');
    case 'skipped':
      return t('desktop.row.problem.skipped');
  }
};

/** 行番号を並べるときの上限。超えたら省略する(数十行を並べても読まれない) */
const MAX_LISTED_LINES = 5;

/** 行番号の並び(「12行目、40行目」)。重複は除き、多ければ末尾を省略する */
export const formatLines = (lines: readonly number[]): string => {
  const unique = [...new Set(lines)].sort((a, b) => a - b);
  const listed = unique
    .slice(0, MAX_LISTED_LINES)
    .map((line) => t('desktop.common.lines', String(line)))
    .join(t('desktop.common.lineSeparator'));
  return unique.length > MAX_LISTED_LINES ? `${listed}…` : listed;
};

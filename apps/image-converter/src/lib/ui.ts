import { LoadingOverlay } from '@konomi-app/ui';

const singleton = new LoadingOverlay();

/** ロード画面操作用クラスのシングルトン */
export const loadingOverlay = singleton;

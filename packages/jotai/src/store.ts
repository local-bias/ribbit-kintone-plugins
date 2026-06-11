import { createStore } from 'jotai';

/**
 * プラグイン共通のJotaiストア。
 * このパッケージはソース配布でプラグインごとにバンドルされるため、
 * プラグイン間でストアが共有されることはない(1プラグイン = 1ストア)。
 */
export const store = createStore();

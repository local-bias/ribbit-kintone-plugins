import { store } from '@repo/jotai';
import { createRoot } from 'react-dom/client';
import { LAUNCHER_ROOT_ID } from '@/lib/constants';
import type { BootstrapResult } from '../bootstrap';
import { whenBodyReady } from '../dom';
import { mutedIdsAtom, panelStateAtom, runtimeViewAtom, servicesAtom } from '../states/launcher';
import { LauncherApp } from './app';

/**
 * ランチャーをストアへつなぎ、本文の末尾へ描画します
 *
 * `apps/tab`の`render.ts`と同じく、`ComponentManager`(約760KB)は使わない
 *
 * @returns 実行基盤の状態が変わったときに呼ぶ関数
 */
export const startLauncher = (result: BootstrapResult): (() => void) => {
  const publish = () => store.set(runtimeViewAtom, result.view());
  store.set(servicesAtom, result.services);
  store.set(mutedIdsAtom, result.services.readMuted());
  store.set(panelStateAtom, result.services.readPanelState());
  publish();

  whenBodyReady(() => {
    const container = document.createElement('div');
    container.id = LAUNCHER_ROOT_ID;
    // `🐸`はプラグイン共通のスタイルスコープ
    container.classList.add('🐸');
    document.body.appendChild(container);
    createRoot(container).render(<LauncherApp />);
  });
  return publish;
};

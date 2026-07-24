import { listener } from '@/lib/listener';
import { restorePluginConfig } from '@/lib/plugin';
import { VIEW_ROOT_ID } from '@/lib/static';
import { css } from '@emotion/css';
import { createRoot } from 'react-dom/client';
import App from './components';
import { store } from '@/lib/store';
import { pluginConditionAtom } from './states/kintone';
import { isDev } from '@/lib/global';

listener.add(['app.record.index.show'], (event) => {
  const config = restorePluginConfig();

  const root = document.getElementById(VIEW_ROOT_ID);
  if (!root) {
    return event;
  }

  const found = config.conditions.find((condition) => Number(condition.viewId) === event.viewId);
  if (!found) {
    return event;
  }

  if (isDev) {
    console.log('pluginCondition', found);
  }
  store.set(pluginConditionAtom, found);

  document.body.classList.add(css`
    .gaia-mobile-v2-pagelayout-contents {
      width: auto;
      height: auto;
      transform: none;
      transition: none;
    }
    .gaia-mobile-v2-navigationpanel,
    .gaia-mobile-v2-viewpanel-footer,
    .gaia-mobile-v2-viewpanel-globalnavigationbar-navigationpanel-button {
      display: none;
    }
  `);

  createRoot(root).render(<App />);

  return event;
});

import { createRoot } from 'react-dom/client';
import invariant from 'tiny-invariant';
import App from './app';

const root = document.getElementById('settings');
invariant(root, 'プラグイン設定のルート要素が見つかりません。');
createRoot(root).render(<App />);

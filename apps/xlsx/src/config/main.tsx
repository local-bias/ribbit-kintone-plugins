import React from 'react';
import { createRoot } from 'react-dom/client';
import invariant from 'tiny-invariant';
import App from './app';

const root = document.getElementById('settings');
invariant(root, 'プラグインのHTMLに、ルート要素が存在しません。');
createRoot(root).render(<App />);

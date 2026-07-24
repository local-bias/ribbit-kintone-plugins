import { createRoot } from 'react-dom/client';

import { t } from '@/lib/i18n-plugin';
import App from './app';

const root = document.getElementById('settings');
if (!root) {
  throw t('config.error.rootElementNotFound');
}
createRoot(root).render(<App />);

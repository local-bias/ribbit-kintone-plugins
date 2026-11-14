import { renderConfigApp } from '@repo/plugin/react';
import { t } from '@/lib/i18n';
import App from './app';

renderConfigApp(<App />, { errorMessage: t('common.config.error.rootNotFound') });

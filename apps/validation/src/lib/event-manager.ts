import { KintoneEventManager } from '@konomi-app/kintone-utilities';
import { PLUGIN_NAME } from './constants';
import { isProd } from './global';
import { t } from './i18n';

export const manager = new KintoneEventManager({
  errorHandler: (error, props) => {
    const { event } = props;
    event.error = t('desktop.error.plugin', PLUGIN_NAME);
    console.error('エラー', error);
    return event;
  },
  logPrefix: `[${PLUGIN_NAME}] `,
  logDisabled: isProd,
});

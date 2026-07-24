import { KintoneEventManager } from '@konomi-app/kintone-utilities';
import { t } from './i18n-plugin';
import { PLUGIN_NAME } from './static';

export const listener = new KintoneEventManager({
  errorHandler: (error, props) => {
    const { event } = props;
    event.error = t('common.error.pluginError', PLUGIN_NAME);
    console.error('エラー', error);
    return event;
  },
  logDisabled: process.env.NODE_ENV === 'production',
});

process.env.NODE_ENV === 'development' &&
  console.info('[plugin] Event listener has been initialized');

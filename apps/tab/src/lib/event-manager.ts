import { createPluginEventManager } from '@repo/plugin';
import { PLUGIN_NAME } from './constants';
import { isProd } from './global';

export const manager = createPluginEventManager({ pluginName: PLUGIN_NAME, isProd });

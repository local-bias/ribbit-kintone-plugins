import { detectGuestSpaceId } from '@konomi-app/kintone-utilities';

export const PLUGIN_ID = kintone.$PLUGIN_ID;
export const GUEST_SPACE_ID = detectGuestSpaceId() ?? undefined;

export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';

isDev && console.log('[plugin] Global variables have been redefined');

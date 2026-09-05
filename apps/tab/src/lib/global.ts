import { detectGuestSpaceId } from '@konomi-app/kintone-utilities';

// `process.env.NODE_ENV`はビルド時にリテラル置換されるため、Node.jsの型定義には依存しない
declare const process: { env: { NODE_ENV?: string } };

export const ENV = (process.env.NODE_ENV ?? 'production') as 'production' | 'development';
export const isProd = ENV === 'production';
export const isDev = ENV === 'development';

export const PLUGIN_ID = kintone.$PLUGIN_ID;
export const GUEST_SPACE_ID = detectGuestSpaceId() ?? undefined;
export const LOGIN_USER = kintone.getLoginUser();
export const LANGUAGE = LOGIN_USER?.language;

if (!isProd) {
  console.log('[plugin] Global variables have been redefined', {
    PLUGIN_ID,
    GUEST_SPACE_ID,
    LANGUAGE,
  });
}

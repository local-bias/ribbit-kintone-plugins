export const ENV = (process.env.NODE_ENV ?? 'production') as 'production' | 'development';
export const isProd = ENV === 'production';

export const LANGUAGE = kintone.getLoginUser()?.language;

/** 実行されている環境がモバイル端末である場合はTrueを返却します */
export const isMobile = (eventType?: string): boolean => {
  if (eventType) {
    return eventType.includes('mobile.');
  }
  return cybozu?.data?.IS_MOBILE_DEVICE ?? !kintone.app.getId();
};

/** モバイル対応 ```kintone.app()``` */
export const getApp = (eventType?: string): typeof kintone.mobile.app | typeof kintone.app =>
  isMobile(eventType) ? kintone.mobile.app : kintone.app;

/** モバイル対応 ```kintone.app.getId()``` */
export const getAppId = (): number | null => getApp().getId();

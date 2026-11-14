/** `document.body`が用意されてから実行します(desktop.jsは本文より先に読まれうる) */
export const whenBodyReady = (callback: () => void): void => {
  if (document.body) {
    callback();
    return;
  }
  document.addEventListener('DOMContentLoaded', callback, { once: true });
};

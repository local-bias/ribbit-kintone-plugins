import { css } from '@emotion/css';
import { store } from '@repo/jotai';
import { handleDrawerOpenAtom, type OpenPreviewParams } from './states/drawer';

const PREVIEW_OPEN_EVENT = 'ribbit-kintone-plugin-attachment-preview:open';

type PreviewOpenEvent = CustomEvent<{
  fileKey?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  onHandled?: unknown;
}>;

type PreviewWindow = Window &
  typeof globalThis & {
    ribbitKintoneAttachmentPreview?: {
      open: (params: OpenPreviewParams) => void;
    };
  };

let isIntegrationRegistered = false;

export function openPreview(params: OpenPreviewParams) {
  store.set(handleDrawerOpenAtom, params);
}

/**
 * 外部スクリプトからプレビューを開けるよう、グローバルAPIとカスタムイベントを登録します。
 */
export function registerAttachmentPreviewIntegration() {
  if (isIntegrationRegistered) {
    return;
  }

  const previewWindow = window as PreviewWindow;
  previewWindow.ribbitKintoneAttachmentPreview = { open: openPreview };
  previewWindow.addEventListener(PREVIEW_OPEN_EVENT, (event) => {
    const detail = (event as PreviewOpenEvent).detail;
    const fileKey = detail?.fileKey;
    const fileName = detail?.fileName;
    if (typeof fileKey !== 'string' || !fileKey) {
      return;
    }
    if (typeof fileName !== 'string' || !fileName) {
      return;
    }
    const contentType = typeof detail.contentType === 'string' ? detail.contentType : undefined;

    if (typeof detail.onHandled === 'function') {
      detail.onHandled();
    }
    openPreview({ key: fileKey, name: fileName, contentType });
  });
  isIntegrationRegistered = true;
}

export function createPreviewButton(params: OpenPreviewParams) {
  const buttonElement = document.createElement('span');
  buttonElement.classList.add(css`
    padding: 1px 6px;
    font-size: 11px;
    border-radius: 9999px;
    cursor: pointer;
    margin-left: 4px;
    color: var(--🐸primary);
    border: 1px solid var(--🐸primary);
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: color-mix(in oklab, var(--🐸primary) 15%, transparent);
    }
  `);
  buttonElement.textContent = 'プレビュー';
  buttonElement.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    openPreview(params);
  });
  return buttonElement;
}

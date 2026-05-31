import { css } from '@emotion/css';
import { store } from '@repo/jotai';
import { handleDrawerOpenAtom } from './states/drawer';

const ZIP_PREVIEW_OPEN_EVENT = 'ribbit-kintone-plugin-zip-preview:open';

type ZipPreviewParams = {
  fileKey: string;
  fileName: string;
};

type ZipPreviewOpenEvent = CustomEvent<{
  fileKey?: unknown;
  fileName?: unknown;
  onHandled?: unknown;
}>;

type ZipPreviewWindow = Window &
  typeof globalThis & {
    ribbitKintoneZipPreview?: {
      open: (params: ZipPreviewParams) => void;
    };
  };

let isIntegrationRegistered = false;

export function openPreview(params: ZipPreviewParams) {
  store.set(handleDrawerOpenAtom, { key: params.fileKey, name: params.fileName });
}

export function registerZipPreviewIntegration() {
  if (isIntegrationRegistered) {
    return;
  }

  const previewWindow = window as ZipPreviewWindow;
  previewWindow.ribbitKintoneZipPreview = { open: openPreview };
  previewWindow.addEventListener(ZIP_PREVIEW_OPEN_EVENT, (event) => {
    const detail = (event as ZipPreviewOpenEvent).detail;
    const fileKey = detail?.fileKey;
    const fileName = detail?.fileName;
    if (typeof fileKey !== 'string' || !fileKey) {
      return;
    }
    if (typeof fileName !== 'string' || !fileName) {
      return;
    }

    if (typeof detail.onHandled === 'function') {
      detail.onHandled();
    }
    openPreview({ fileKey, fileName });
  });
  isIntegrationRegistered = true;
}

export function createPreviewButton(params: { key: string; name: string }) {
  const { key: fileKey, name: fileName } = params;
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
    openPreview({ fileKey, fileName });
  });
  return buttonElement;
}

import { css } from '@emotion/css';
import { store } from '@repo/jotai';
import { handleDrawerOpenAtom, previewFileKeyAtom } from './public-state';

const PDF_PREVIEW_OPEN_EVENT = 'ribbit-kintone-plugin-pdf-preview:open';

type PdfPreviewOpenEvent = CustomEvent<{
  fileKey?: unknown;
  onHandled?: unknown;
}>;

type PdfPreviewWindow = Window &
  typeof globalThis & {
    ribbitKintonePdfPreview?: {
      open: (fileKey: string) => void;
    };
  };

let isIntegrationRegistered = false;

export function openPreview(fileKey: string) {
  store.set(previewFileKeyAtom, fileKey);
  store.set(handleDrawerOpenAtom);
}

export function registerPdfPreviewIntegration() {
  if (isIntegrationRegistered) {
    return;
  }

  const previewWindow = window as PdfPreviewWindow;
  previewWindow.ribbitKintonePdfPreview = { open: openPreview };
  previewWindow.addEventListener(PDF_PREVIEW_OPEN_EVENT, (event) => {
    const detail = (event as PdfPreviewOpenEvent).detail;
    const fileKey = detail?.fileKey;
    if (typeof fileKey !== 'string' || !fileKey) {
      return;
    }

    if (typeof detail.onHandled === 'function') {
      detail.onHandled();
    }
    openPreview(fileKey);
  });
  isIntegrationRegistered = true;
}

export function createPreviewButton(fileKey: string) {
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
    openPreview(fileKey);
  });
  return buttonElement;
}

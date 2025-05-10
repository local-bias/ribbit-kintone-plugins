import { store } from '@repo/jotai';
import {
  handleDrawerOpenAtom,
  previewZipFileKeyAtom,
  previewZipFileNameAtom,
} from './public-state';
import { css } from '@emotion/css';

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
    store.set(previewZipFileKeyAtom, fileKey);
    store.set(previewZipFileNameAtom, fileName);
    store.set(handleDrawerOpenAtom);
  });
  return buttonElement;
}

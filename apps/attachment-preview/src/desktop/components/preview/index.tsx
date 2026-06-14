import { useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  previewBlobAtom,
  previewFileNameAtom,
  previewKindAtom,
} from '../../public-state';
import { ErrorPlaceholder, LoadingPlaceholder } from './placeholder';
import ArchivePreview from './renderers/archive';
import AudioPreview from './renderers/audio';
import DocumentPreview from './renderers/document';
import HtmlPreview from './renderers/html';
import ImagePreview from './renderers/image';
import MarkdownPreview from './renderers/markdown';
import PdfPreview from './renderers/pdf';
import SpreadsheetPreview from './renderers/spreadsheet';
import TextPreview from './renderers/text';
import UnsupportedPreview from './renderers/unsupported';
import VideoPreview from './renderers/video';

function PreviewContent() {
  const blob = useAtomValue(previewBlobAtom);
  const kind = useAtomValue(previewKindAtom);
  const fileName = useAtomValue(previewFileNameAtom);

  if (!blob || !fileName) {
    return <ErrorPlaceholder />;
  }

  switch (kind) {
    case 'image':
      return <ImagePreview blob={blob} fileName={fileName} />;
    case 'pdf':
      return <PdfPreview blob={blob} fileName={fileName} />;
    case 'video':
      return <VideoPreview blob={blob} fileName={fileName} />;
    case 'audio':
      return <AudioPreview blob={blob} fileName={fileName} />;
    case 'markdown':
      return <MarkdownPreview blob={blob} />;
    case 'html':
      return <HtmlPreview blob={blob} fileName={fileName} />;
    case 'text':
      return <TextPreview blob={blob} fileName={fileName} />;
    case 'spreadsheet':
      return <SpreadsheetPreview blob={blob} fileName={fileName} />;
    case 'document':
      return <DocumentPreview blob={blob} />;
    case 'archive':
      return <ArchivePreview blob={blob} />;
    default:
      return <UnsupportedPreview fileName={fileName} />;
  }
}

export default function Preview() {
  return (
    <ErrorBoundary
      fallback={<ErrorPlaceholder message='このファイルのプレビュー中にエラーが発生しました。' />}
    >
      <Suspense fallback={<LoadingPlaceholder />}>
        <PreviewContent />
      </Suspense>
    </ErrorBoundary>
  );
}

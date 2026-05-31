import styled from '@emotion/styled';
import { downloadFile, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { useSnackbar } from 'notistack';
import type { MouseEvent } from 'react';

type Props = { files: kintoneAPI.field.File['value'] };
type LinkProps = {
  file: kintoneAPI.field.File['value'][number];
  availablePreviews: AvailableFilePreviews;
};

type FilePreviewType = 'pdf' | 'zip';

type AvailableFilePreviews = Readonly<{
  pdf: boolean;
  zip: boolean;
}>;

const PDF_PREVIEW_OPEN_EVENT = 'ribbit-kintone-plugin-pdf-preview:open';
const ZIP_PREVIEW_OPEN_EVENT = 'ribbit-kintone-plugin-zip-preview:open';

type FilePreviewWindow = Window &
  typeof globalThis & {
    ribbitKintonePdfPreview?: {
      open: (fileKey: string) => void;
    };
    ribbitKintoneZipPreview?: {
      open: (params: { fileKey: string; fileName: string }) => void;
    };
  };

function isPdfFile(file: kintoneAPI.field.File['value'][number]) {
  return file.contentType === 'application/pdf';
}

function isZipFile(file: kintoneAPI.field.File['value'][number]) {
  return (
    file.contentType === 'application/zip' || file.contentType === 'application/x-zip-compressed'
  );
}

function getPdfPreviewOpen() {
  const previewWindow = window as FilePreviewWindow;
  const openPreview = previewWindow.ribbitKintonePdfPreview?.open;
  return typeof openPreview === 'function' ? openPreview : null;
}

function getZipPreviewOpen() {
  const previewWindow = window as FilePreviewWindow;
  const openPreview = previewWindow.ribbitKintoneZipPreview?.open;
  return typeof openPreview === 'function' ? openPreview : null;
}

function getAvailableFilePreviews(): AvailableFilePreviews {
  return {
    pdf: Boolean(getPdfPreviewOpen()),
    zip: Boolean(getZipPreviewOpen()),
  };
}

function getFilePreviewType(
  file: kintoneAPI.field.File['value'][number],
  availablePreviews: AvailableFilePreviews
): FilePreviewType | null {
  if (availablePreviews.pdf && isPdfFile(file)) {
    return 'pdf';
  }
  if (availablePreviews.zip && isZipFile(file)) {
    return 'zip';
  }
  return null;
}

function openPdfPreview(fileKey: string) {
  const openPreview = getPdfPreviewOpen();
  if (openPreview) {
    openPreview(fileKey);
    return true;
  }

  const previewWindow = window as FilePreviewWindow;
  let handled = false;
  previewWindow.dispatchEvent(
    new CustomEvent(PDF_PREVIEW_OPEN_EVENT, {
      detail: {
        fileKey,
        onHandled: () => {
          handled = true;
        },
      },
    })
  );
  return handled;
}

function openZipPreview(file: kintoneAPI.field.File['value'][number]) {
  const openPreview = getZipPreviewOpen();
  if (openPreview) {
    openPreview({ fileKey: file.fileKey, fileName: file.name });
    return true;
  }

  const previewWindow = window as FilePreviewWindow;
  let handled = false;
  previewWindow.dispatchEvent(
    new CustomEvent(ZIP_PREVIEW_OPEN_EVENT, {
      detail: {
        fileKey: file.fileKey,
        fileName: file.name,
        onHandled: () => {
          handled = true;
        },
      },
    })
  );
  return handled;
}

function openFilePreview(
  file: kintoneAPI.field.File['value'][number],
  previewType: FilePreviewType
) {
  if (previewType === 'pdf') {
    return openPdfPreview(file.fileKey);
  }
  return openZipPreview(file);
}

function Link({ availablePreviews, file }: LinkProps) {
  const { enqueueSnackbar } = useSnackbar();
  const previewType = getFilePreviewType(file, availablePreviews);

  const onClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    let fileUrl: string | null = null;
    try {
      const link = document.createElement('a');
      const blob = await downloadFile({ fileKey: file.fileKey });
      fileUrl = URL.createObjectURL(blob);
      link.download = file.name;
      link.href = fileUrl;
      link.click();
      enqueueSnackbar('ファイルをダウンロードしました', { variant: 'success' });
    } catch {
      enqueueSnackbar('ファイルのダウンロードに失敗しました', { variant: 'error' });
    } finally {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    }
  };

  const onPreviewClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!previewType) {
      return;
    }
    const opened = openFilePreview(file, previewType);
    if (!opened) {
      enqueueSnackbar('プレビュープラグインが有効ではありません', { variant: 'warning' });
    }
  };

  return (
    <FileLinkRow>
      <DownloadButton type='button' onClick={onClick}>
        {file.name}
      </DownloadButton>
      {previewType && (
        <PreviewButton type='button' onClick={onPreviewClick}>
          プレビュー
        </PreviewButton>
      )}
    </FileLinkRow>
  );
}

function Container({ className, files }: Props & { className?: string }) {
  const availablePreviews = getAvailableFilePreviews();

  return (
    <div className={className}>
      {files.map((file) => (
        <Link key={file.fileKey} availablePreviews={availablePreviews} file={file} />
      ))}
    </div>
  );
}

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
`;

const FileLinkRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const DownloadButton = styled.button`
  padding: 0;
  color: #3498db;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

const PreviewButton = styled.button`
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.5;
  border-radius: 9999px;
  cursor: pointer;
  color: var(--🐸primary);
  border: 1px solid var(--🐸primary);
  background: transparent;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: color-mix(in oklab, var(--🐸primary) 15%, transparent);
  }
`;

export default StyledContainer;

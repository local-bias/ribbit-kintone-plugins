import { DocumentIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { dataUrlAtom } from '@/desktop/original-view/states/kintone';
import type { FileAttachment, FileBase64Attachment, MessageAttachment } from '@/lib/static';

type Props = {
  attachment: MessageAttachment;
};

function ImageFilePreview({ attachment }: { attachment: FileAttachment }) {
  const dataUrl = useAtomValue(dataUrlAtom(attachment.fileKey));
  if (!dataUrl) {
    return null;
  }
  return (
    <img
      src={dataUrl}
      alt={attachment.fileName}
      style={{ maxWidth: '384px', borderRadius: '8px' }}
    />
  );
}
function ImagePreview({ attachment }: { attachment: FileBase64Attachment }) {
  return (
    <img
      src={attachment.dataUrl}
      alt={attachment.fileName}
      style={{ maxWidth: '384px', borderRadius: '8px' }}
    />
  );
}
function PdfPreview({ src, fileName }: { src: string; fileName: string }) {
  return (
    <div className='rad:flex rad:flex-col rad:gap-2 rad:max-w-[384px]'>
      <div className='rad:flex rad:items-center rad:gap-2 rad:p-2 rad:rounded rad:bg-gray-100'>
        <DocumentIcon className='rad:w-5 rad:h-5 rad:text-red-500 rad:shrink-0' />
        <span className='rad:text-sm rad:truncate'>{fileName}</span>
      </div>
      <iframe
        src={src}
        title={fileName}
        style={{ width: '384px', height: '500px', border: 'none', borderRadius: '8px' }}
      />
    </div>
  );
}

function PdfFilePreview({ attachment }: { attachment: FileAttachment }) {
  const dataUrl = useAtomValue(dataUrlAtom(attachment.fileKey));
  if (!dataUrl) {
    return null;
  }
  return <PdfPreview src={dataUrl} fileName={attachment.fileName} />;
}

function FilePreview({ attachment }: { attachment: FileAttachment | FileBase64Attachment }) {
  return (
    <div className='rad:flex rad:items-center rad:gap-2 rad:p-2 rad:rounded rad:bg-gray-100'>
      <DocumentIcon className='rad:w-5 rad:h-5 rad:text-gray-500 rad:shrink-0' />
      <span className='rad:text-sm rad:truncate'>{attachment.fileName}</span>
    </div>
  );
}

export default function AttachedFile({ attachment }: Props) {
  switch (attachment.type) {
    case 'fact-check': {
      return null;
    }
    case 'file': {
      if (attachment.mimeType.startsWith('image/')) {
        return <ImageFilePreview attachment={attachment} />;
      }
      if (attachment.mimeType === 'application/pdf') {
        return <PdfFilePreview attachment={attachment} />;
      }
      return <FilePreview attachment={attachment} />;
    }
    case 'file-base64': {
      if (attachment.mimeType.startsWith('image/')) {
        return <ImagePreview attachment={attachment} />;
      }
      if (attachment.mimeType === 'application/pdf') {
        return <PdfPreview src={attachment.dataUrl} fileName={attachment.fileName} />;
      }
      return <FilePreview attachment={attachment} />;
    }
  }
}

import { FileContent, formatFileSize } from '@/lib/files';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChevronDown, ChevronRight, File, FileX2, Folder } from 'lucide-react';
import { Suspense, useState } from 'react';
import { handleFileContentSelectAtom, previewFileAtom } from '../public-state';

// 日付をフォーマットする関数
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
}

function FileComponent({ content, depth = 0 }: { content: FileContent; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const onFileSelect = useSetAtom(handleFileContentSelectAtom);

  if (!content) {
    return null;
  }

  return (
    <div className='rad:w-full rad:py-1'>
      <div
        className='rad:flex rad:items-center rad:gap-2 rad:p-1 rad:rounded rad:hover:bg-gray-100 rad:cursor-pointer'
        onClick={(e) => {
          e.stopPropagation();
          if (content.isDirectory) {
            setIsExpanded(!isExpanded);
          } else {
            onFileSelect(content.key);
          }
        }}
      >
        {content.isDirectory ? (
          <>
            <div className='rad:flex rad:items-center'>
              {isExpanded ? (
                <ChevronDown className='rad:w-4 rad:h-4 rad:text-gray-500' />
              ) : (
                <ChevronRight className='rad:w-4 rad:h-4 rad:text-gray-500' />
              )}
            </div>
            <Folder className='rad:w-5 rad:h-5 rad:text-blue-500' />
          </>
        ) : (
          <>
            <div className='rad:w-4' />
            <File className='rad:w-5 rad:h-5 rad:text-gray-500' />
          </>
        )}

        <span className='rad:flex-1 rad:font-medium rad:truncate'>{content.name}</span>

        {!content.isDirectory && (
          <span className='rad:text-xs rad:text-gray-500 rad:ml-2'>
            {formatFileSize(content.size)}
          </span>
        )}

        <span className='rad:text-xs rad:text-gray-500 rad:ml-2 rad:hidden rad:md:inline'>
          {formatDate(content.updatedAt)}
        </span>
      </div>

      {content.isDirectory && content.children && isExpanded && (
        <div className='rad:ml-2 rad:border-l-2 rad:border-gray-200'>
          {content.children.map((child, index) => (
            <div key={`${child.path}-${index}`} className='rad:w-full rad:pl-4'>
              <FileComponent content={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Placeholder() {
  return (
    <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>
      <LoaderWithLabel label='Zipファイルを解析しています' />
    </div>
  );
}

function ErrorPlaceholder() {
  return (
    <div className='rad:w-full rad:h-full rad:grid rad:place-items-center rad:text-foreground/70'>
      <div className='rad:p-4 rad:grid rad:place-items-center rad:gap-8'>
        <div>ファイルの読み込みに失敗しました。</div>
        <FileX2 className='rad:w-16 rad:h-16' />
      </div>
    </div>
  );
}

function ZipPreviewComponent() {
  const content = useAtomValue(previewFileAtom);
  if (!content) {
    return <ErrorPlaceholder />;
  }

  // content が配列であることを確認
  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <div className='rad:p-4 rad:overflow-auto rad:h-full rad:max-h-screen'>
      {contentArray.map((fileContent, index) => (
        <FileComponent key={`${fileContent.path}-${index}`} content={fileContent} />
      ))}
    </div>
  );
}

export default function ZipPreview() {
  return (
    <Suspense fallback={<Placeholder />}>
      <ZipPreviewComponent />
    </Suspense>
  );
}

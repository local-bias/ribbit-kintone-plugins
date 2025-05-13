import { FileContent, formatFileSize } from '@/lib/files';
import { cn } from '@repo/utils';
import { useSetAtom } from 'jotai';
import { ChevronRight, File, Folder } from 'lucide-react';
import { useState } from 'react';
import { handleFileContentSelectAtom } from '../../public-state';

// 日付をフォーマットする関数
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
}

export default function ZipFileContent(props: { content: FileContent; depth?: number }) {
  const { content, depth = 0 } = props;

  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const onFileSelect = useSetAtom(handleFileContentSelectAtom);

  if (!content) {
    return null;
  }

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content.isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(content.key);
    }
  };

  return (
    <div className='rad:w-full rad:py-1'>
      <div
        className='rad:flex rad:items-center rad:gap-2 rad:p-1 rad:rounded rad:hover:bg-gray-100 rad:cursor-pointer'
        onClick={onClick}
      >
        {content.isDirectory ? (
          <>
            <div className='rad:flex rad:items-center'>
              <ChevronRight
                className={cn('rad:w-4 rad:h-4 rad:text-foreground/50 rad:transition-transform', {
                  'rad:rotate-90': isExpanded,
                })}
              />
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
        <div className='rad:ml-2.5 rad:border-l-2 rad:border-border'>
          {content.children.map((child, index) => (
            <div
              key={`${child.path}-${index}`}
              className={cn('rad:w-full rad:pl-4', { 'rad:pl-2': depth > 0 })}
            >
              <ZipFileContent content={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { inputFilesAtom, selectedPluginConditionAtom } from '@/desktop/original-view/states/states';
import { isConvertibleFile } from '@/lib/file-converter';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useAtomValue, useSetAtom } from 'jotai';
import { DragEvent, FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  children: ReactNode;
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const borderDash = keyframes`
  to { stroke-dashoffset: 0; }
`;

const OverlayRoot = styled.div`
  animation: ${fadeIn} 0.2s ease-out both;
`;

const AnimatedBorder = styled.div`
  position: absolute;
  inset: 0;
  border-radius: var(--🐸radius);
  overflow: hidden;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 2px dashed rgba(59, 130, 246, 0.5);
    animation: ${borderDash} 0.6s ease-out;
  }
`;

const DropOverlay: FC<{ onDrop: (e: DragEvent) => void; onDragOver: (e: DragEvent) => void }> = ({
  onDrop,
  onDragOver,
}) => (
  <OverlayRoot
    className='rad:absolute rad:inset-x-0 rad:-top-16 rad:-bottom-4 rad:z-50 rad:flex rad:items-center rad:justify-center rad:rounded-[var(--🐸radius)] rad:bg-blue-50/70 rad:backdrop-blur-sm'
    onDrop={onDrop}
    onDragOver={onDragOver}
  >
    <AnimatedBorder />
    <div className='rad:flex rad:flex-col rad:items-center rad:gap-3 rad:text-blue-500 rad:pointer-events-none'>
      <div className='rad:rounded-full rad:bg-blue-100 rad:p-4'>
        <ArrowDownTrayIcon className='rad:w-8 rad:h-8' />
      </div>
      <span className='rad:text-sm rad:font-semibold rad:tracking-wide'>
        ファイルをドロップして追加
      </span>
      <span className='rad:text-xs rad:text-blue-400'>画像・PDF・Excel・テキスト に対応</span>
    </div>
  </OverlayRoot>
);

function DropZoneComponent({ children }: Props) {
  const setFiles = useSetAtom(inputFilesAtom);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ウィンドウレベルでドラッグイベントを監視
  useEffect(() => {
    const onWindowDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const onWindowDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
    };

    const onWindowDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
      }
    };

    const onWindowDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);
    };

    window.addEventListener('dragenter', onWindowDragEnter);
    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('dragleave', onWindowDragLeave);
    window.addEventListener('drop', onWindowDrop);

    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('dragleave', onWindowDragLeave);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, []);

  // ドロップゾーン上でのドロップ処理
  const onLocalDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const acceptedFiles = droppedFiles.filter((file) => {
        return (
          file.type.startsWith('image/') ||
          file.type === 'application/pdf' ||
          isConvertibleFile(file)
        );
      });

      if (acceptedFiles.length > 0) {
        setFiles((prev) => [...prev, ...acceptedFiles]);
      }
    },
    [setFiles]
  );

  const onLocalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div ref={containerRef} className='rad:relative'>
      {children}
      {isDragOver && <DropOverlay onDrop={onLocalDrop} onDragOver={onLocalDragOver} />}
    </div>
  );
}

export default function DropZone({ children }: Props) {
  const condition = useAtomValue(selectedPluginConditionAtom);
  if (!condition.allowImageUpload) {
    return <>{children}</>;
  }
  return <DropZoneComponent>{children}</DropZoneComponent>;
}

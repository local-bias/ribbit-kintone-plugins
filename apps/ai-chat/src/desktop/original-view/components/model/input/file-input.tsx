import { inputFilesAtom, selectedPluginConditionAtom } from '@/desktop/original-view/states/states';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChangeEventHandler, useRef } from 'react';

const FILE_ACCEPT = [
  'image/*',
  'application/pdf',
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet',
  '.xlsx',
  '.xls',
  '.ods',
  // テキスト
  'text/plain',
  'text/csv',
  'text/tab-separated-values',
  '.txt',
  '.csv',
  '.tsv',
  '.log',
  '.md',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
].join(',');

function FileInputComponent() {
  const setFiles = useSetAtom(inputFilesAtom);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileAdd: ChangeEventHandler<HTMLInputElement> = (event) => {
    const newFiles = Array.from(event.target.files ?? []);
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
    // 同じファイルを再選択できるようにリセット
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className='rad:p-2! rad:h-full rad:sticky rad:top-0'>
      <label
        title='ファイルを追加（画像・PDF・Excel・テキスト）'
        htmlFor='file-input'
        className='rad:flex rad:p-2! rad:rounded-full rad:border! rad:border-solid rad:border-input rad:cursor-pointer rad:transition-all rad:hover:bg-gray-100 rad:hover:text-blue-500'
      >
        <PaperClipIcon className='rad:w-6 rad:h-6' />
        <input
          ref={inputRef}
          id='file-input'
          type='file'
          accept={FILE_ACCEPT}
          multiple
          className='rad:hidden'
          onChange={onFileAdd}
        />
      </label>
    </div>
  );
}

export default function FileInput() {
  const condition = useAtomValue(selectedPluginConditionAtom);
  if (!condition.allowImageUpload) {
    return null;
  }
  return <FileInputComponent />;
}

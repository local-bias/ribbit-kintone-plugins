import DOMPurify from 'dompurify';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAsync } from '../use-async';
import { ErrorPlaceholder, LoadingPlaceholder, MessagePlaceholder } from '../placeholder';

type ParsedWorkbook = {
  sheetNames: string[];
  sheetHtml: string[];
};

async function parseWorkbook(blob: Blob): Promise<ParsedWorkbook> {
  const buffer = await blob.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const sheetHtml = sheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    if (!sheet) return '';
    const html = XLSX.utils.sheet_to_html(sheet, { editable: false });
    return DOMPurify.sanitize(html);
  });
  return { sheetNames, sheetHtml };
}

export default function SpreadsheetPreview({ blob }: { blob: Blob; fileName?: string }) {
  const state = useAsync(() => parseWorkbook(blob), [blob]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (state.status === 'loading') {
    return <LoadingPlaceholder label='表計算ファイルを解析しています' />;
  }
  if (state.status === 'error') {
    return <ErrorPlaceholder message='表計算ファイルの解析に失敗しました。' />;
  }

  const { sheetNames, sheetHtml } = state.data;
  if (sheetNames.length === 0) {
    return <MessagePlaceholder>表示できるシートがありませんでした。</MessagePlaceholder>;
  }

  const safeIndex = Math.min(activeIndex, sheetNames.length - 1);

  return (
    <div className='rad:flex rad:flex-col rad:h-full'>
      {sheetNames.length > 1 && (
        <div className='rad:flex rad:gap-1 rad:px-4 rad:pt-3 rad:flex-wrap rad:border-b rad:border-border'>
          {sheetNames.map((name, index) => (
            <button
              type='button'
              key={name}
              onClick={() => setActiveIndex(index)}
              className={
                index === safeIndex
                  ? 'rad:px-3 rad:py-1.5 rad:text-xs rad:rounded-t rad:border rad:border-b-0 rad:border-border rad:bg-background rad:font-medium'
                  : 'rad:px-3 rad:py-1.5 rad:text-xs rad:rounded-t rad:text-foreground/60 rad:hover:bg-foreground/5'
              }
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className='🐸spreadsheet-body rad:overflow-auto rad:p-4'>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: SheetJS出力をDOMPurifyでサニタイズ済み */}
        <div dangerouslySetInnerHTML={{ __html: sheetHtml[safeIndex] ?? '' }} />
      </div>
    </div>
  );
}

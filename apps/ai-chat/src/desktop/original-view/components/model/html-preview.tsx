import { t } from '@/lib/i18n';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import PreviewIcon from '@mui/icons-material/Preview';
import PrintIcon from '@mui/icons-material/Print';
import { IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { FC, useCallback, useRef, useState } from 'react';

type Props = {
  html: string;
  onClose?: () => void;
};

type ViewMode = 'preview' | 'source';

/**
 * HTMLプレビューコンポーネント
 * sandbox属性付きのiframeで安全にHTMLを表示
 * プレビュー/ソース切り替えと印刷機能付き
 */
const HtmlPreview: FC<Props> = ({ html, onClose }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode) {
      setViewMode(newMode);
    }
  };

  const handlePrint = useCallback(() => {
    if (viewMode === 'preview' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      // ソースモードの場合は新しいウィンドウでHTMLを開いて印刷
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [html, viewMode]);

  return (
    <div className='rad:sticky rad:top-[48px] rad:flex rad:flex-col rad:max-h-[calc(100svh-48px)] rad:overflow-auto rad:border-l rad:border-gray-200'>
      <div className='rad:flex rad:sticky rad:top-0 rad:items-center rad:justify-between rad:px-4 rad:py-2 rad:bg-gray-100 rad:border-b rad:border-gray-200'>
        <Typography variant='subtitle1' className='rad:font-medium'>
          {t('htmlOutput.preview.title')}
        </Typography>
        <div className='rad:flex rad:items-center rad:gap-2'>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size='small'
          >
            <ToggleButton value='preview' aria-label={t('htmlOutput.preview.viewPreview')}>
              <Tooltip title={t('htmlOutput.preview.viewPreview')}>
                <PreviewIcon fontSize='small' />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value='source' aria-label={t('htmlOutput.preview.viewSource')}>
              <Tooltip title={t('htmlOutput.preview.viewSource')}>
                <CodeIcon fontSize='small' />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title={t('htmlOutput.preview.print')}>
            <IconButton
              size='small'
              onClick={handlePrint}
              aria-label={t('htmlOutput.preview.print')}
            >
              <PrintIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title={t('htmlOutput.preview.close')}>
              <IconButton size='small' onClick={onClose} aria-label={t('htmlOutput.preview.close')}>
                <CloseIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
      <div className='rad:flex-1 rad:bg-white'>
        {viewMode === 'preview' ? (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            sandbox='allow-scripts allow-same-origin allow-modals'
            className='rad:w-full rad:h-full rad:border-none'
            title={t('htmlOutput.preview.title')}
          />
        ) : (
          <pre className='rad:p-4 rad:m-0 rad:text-sm rad:font-mono rad:whitespace-pre-wrap rad:break-words rad:bg-gray-50'>
            <code>{html}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default HtmlPreview;

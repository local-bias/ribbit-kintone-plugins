import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { t } from '@/lib/i18n';
import { store } from '@/lib/store';
import PreviewIcon from '@mui/icons-material/Preview';
import { Fab, Tooltip } from '@mui/material';
import { Provider, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { SnackbarProvider } from 'notistack';
import { FC } from 'react';
import { Debug } from './components/debug';
import Layout from './components/layout';
import ChatMessages from './components/model/chat-messages';
import HtmlPreview from './components/model/html-preview';
import Input from './components/model/input';
import Sidebar from './components/model/sidebar';
import {
  autoSelectAssistantEffect,
  htmlPreviewHiddenAtom,
  selectedHistoryAtom,
  urlSearchParamsEffect,
} from './states/states';

const Component: FC = () => {
  useAtom(urlSearchParamsEffect);
  useAtom(autoSelectAssistantEffect);
  const selectedHistory = useAtomValue(selectedHistoryAtom);
  const [isPreviewHidden, setPreviewHidden] = useAtom(htmlPreviewHiddenAtom);
  const hasHtml = !!selectedHistory?.html;
  const showPreview = hasHtml && !isPreviewHidden;

  const handleCloseHtmlPreview = () => {
    setPreviewHidden(true);
  };

  const handleShowHtmlPreview = () => {
    setPreviewHidden(false);
  };

  return (
    <div className={showPreview ? 'rad:grid rad:grid-cols-2 rad:h-full' : ''}>
      <div className={showPreview ? 'rad:overflow-auto' : ''}>
        <Sidebar />
        <PluginErrorBoundary>
          <div className='rad:relative'>
            <ChatMessages />
            <Input />
          </div>
        </PluginErrorBoundary>
        {/* プレビュー再表示ボタン */}
        {hasHtml && isPreviewHidden && (
          <Tooltip title={t('htmlOutput.preview.show')} placement='left'>
            <Fab
              color='primary'
              size='small'
              onClick={handleShowHtmlPreview}
              className='rad:fixed! rad:bottom-24 rad:right-4 rad:z-50'
              aria-label={t('htmlOutput.preview.show')}
            >
              <PreviewIcon />
            </Fab>
          </Tooltip>
        )}
      </div>
      {showPreview && selectedHistory?.html && (
        <HtmlPreview html={selectedHistory.html} onClose={handleCloseHtmlPreview} />
      )}
    </div>
  );
};

const Container: FC = () => (
  <Provider store={store}>
    <PluginErrorBoundary>
      <SnackbarProvider maxSnack={1}>
        <Layout className='🐸'>
          <div className='rad:bg-white rad:min-h-[calc(100vh_-_200px)]'>
            <Component />
          </div>
        </Layout>
        <Debug />
      </SnackbarProvider>
    </PluginErrorBoundary>
  </Provider>
);

export default Container;

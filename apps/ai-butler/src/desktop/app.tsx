import { Provider, store, useAtomValue } from '@repo/jotai';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { pluginConfigAtom } from '@/desktop/public-state';
import AutocompleteRunner from './components/autocomplete-runner';
import ChatPanel from './components/chat-panel';
import FileDropOverlay from './components/file-drop-overlay';
import FloatingButton from './components/floating-button';

function AppContent() {
  const config = useAtomValue(pluginConfigAtom);
  const { chatEnabled, fileAttachmentEnabled, autocompleteEnabled } = config.common;

  return (
    <>
      {chatEnabled && <FloatingButton />}
      {chatEnabled && <ChatPanel />}
      {fileAttachmentEnabled && <FileDropOverlay />}
      {autocompleteEnabled && <AutocompleteRunner />}
      <Toaster position='bottom-left' richColors />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

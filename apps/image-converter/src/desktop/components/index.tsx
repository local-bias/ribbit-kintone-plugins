import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@/components/theme-provider';
import ImageDropzone from '@/desktop/components/drop-zone';
import { store } from '@/lib/store';
import QueuedFiles from './queued-files';

export default function App({ conditionId }: { conditionId: string }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SnackbarProvider>
          <ImageDropzone conditionId={conditionId} />
          <QueuedFiles />
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

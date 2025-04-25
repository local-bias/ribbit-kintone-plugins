import ImageDropzone from '@/components/drop-zone';
import { ThemeProvider } from '@/components/theme-provider';
import { store } from '@/lib/store';
import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
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

import { store } from '@repo/jotai';
import { Provider } from 'jotai';
import { Toaster } from 'sonner';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { GanttContainer } from './components/gantt-container';

export default function GanttApp() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <PluginErrorBoundary>
          <GanttContainer />
          <Toaster position='bottom-right' richColors />
        </PluginErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

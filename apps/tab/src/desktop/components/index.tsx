import { Provider, store } from '@repo/jotai';
import { DesktopErrorBoundary } from './error-boundary';
import TabList from './tab-list';

export default function App() {
  return (
    <Provider store={store}>
      <DesktopErrorBoundary>
        <TabList />
      </DesktopErrorBoundary>
    </Provider>
  );
}

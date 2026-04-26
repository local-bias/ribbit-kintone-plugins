import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import type { FC } from 'react';
import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { store } from '@/lib/store';
import FieldSettingsDialog from './components/model/field-settings-dialog';
import Footer from './components/model/footer';
import Header from './components/model/header';
import Layout from './components/model/layout';
import View from './components/model/view';
import { DocumentIconSymbol } from './components/ui/document-icon';

const App: FC = () => {
  return (
    <>
      <Layout className='🐸'>
        <Header />
        <View />
        <Footer />
      </Layout>
      <FieldSettingsDialog />
    </>
  );
};

const AppContainer: FC = () => (
  <Provider store={store}>
    <DocumentIconSymbol />
    <SnackbarProvider maxSnack={1}>
      <PluginErrorBoundary>
        <App />
      </PluginErrorBoundary>
    </SnackbarProvider>
  </Provider>
);

export default AppContainer;

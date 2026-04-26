import { createStore, Provider } from 'jotai';
import { type FC, useMemo } from 'react';
import { Autocomplete } from '@/desktop/autocomplete/components/autocomplete';
import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { ThemeProvider } from '@/lib/components/theme-provider';
import type { PluginCondition } from '@/lib/plugin';
import { useOptionsInitializer } from './hooks/use-options-initializer';
import { inputValueAtom, inputValueSyncEffect, pluginConditionAtom } from './states';

type ContainerProps = {
  condition: PluginCondition;
  initValue: string;
};

const Component: FC = () => {
  useOptionsInitializer();
  return <Autocomplete />;
};

const Container: FC<ContainerProps> = ({ condition, initValue }) => {
  const store = useMemo(() => {
    const s = createStore();
    s.set(inputValueAtom, initValue);
    s.set(pluginConditionAtom, condition);
    // Subscribe to the effect for syncing input value to kintone record
    s.sub(inputValueSyncEffect, () => {});
    return s;
  }, [initValue, condition]);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <PluginErrorBoundary>
          <div className='🐸'>
            <Component />
          </div>
        </PluginErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
};

export default Container;

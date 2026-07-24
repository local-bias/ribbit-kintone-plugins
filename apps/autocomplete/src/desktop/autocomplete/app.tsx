import { createStore, Provider } from '@repo/jotai';
import { type FC, useEffect, useState } from 'react';
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
  // Lazily created once; store setup must stay out of render (see effect
  // subscription below) since createRoot(...).render(...) is called
  // synchronously from within kintone's show event handler, and React may
  // re-invoke render-phase code.
  const [store] = useState(() => {
    const s = createStore();
    s.set(inputValueAtom, initValue);
    s.set(pluginConditionAtom, condition);
    return s;
  });

  useEffect(() => {
    // Subscribing (not just creating the store) must happen in an effect,
    // not during render: atomEffect runs synchronously on subscribe, and
    // doing that inside render would run it in the same synchronous call
    // stack as kintone's show event dispatch, which kintone doesn't support
    // for kintone.app.record.set() calls.
    return store.sub(inputValueSyncEffect, () => {});
  }, [store]);

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

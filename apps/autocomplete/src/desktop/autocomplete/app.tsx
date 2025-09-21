import { Autocomplete } from '@/desktop/autocomplete/components/autocomplete';
import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { ThemeProvider } from '@/lib/components/theme-provider';
import { PluginCondition } from '@/lib/plugin';
import React, { FC } from 'react';
import { RecoilRoot } from 'recoil';
import { useOptionsInitializer } from './hooks/use-options-initializer';
import { inputValueState, pluginConditionState } from './states';

type ContainerProps = {
  condition: PluginCondition;
  initValue: string;
};

const Component: FC = () => {
  useOptionsInitializer();
  return <Autocomplete />;
};

const Container: FC<ContainerProps> = ({ condition, initValue }) => (
  <RecoilRoot
    initializeState={({ set }) => {
      set(inputValueState, initValue);
      set(pluginConditionState, condition);
    }}
  >
    <ThemeProvider>
      <PluginErrorBoundary>
        <div className='🐸'>
          <Component />
        </div>
      </PluginErrorBoundary>
    </ThemeProvider>
  </RecoilRoot>
);

export default Container;

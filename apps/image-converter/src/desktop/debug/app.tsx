import { PLUGIN_NAME } from '@/lib/constants';
import { store } from '@/lib/store';
import { PluginCondition } from '@/schema/plugin-config';
import { css } from '@emotion/css';
import { Button } from '@mui/material';
import { cn } from '@repo/utils';
import JsonView from '@uiw/react-json-view';
import { Provider, useAtomValue } from 'jotai';
import { useState, type FC } from 'react';
import { pluginConfigAtom } from '../public-state';

const Condition: FC<{ condition: PluginCondition }> = ({ condition }) => {
  return (
    <div>
      <details>
        <summary>
          <div className='text-sm text-gray-800 font-bold'>{condition.id}</div>
        </summary>
        <JsonView value={{ ...condition }} />
      </details>
    </div>
  );
};

const DebugContent: FC = () => {
  const pluginConfig = useAtomValue(pluginConfigAtom);
  return (
    <div>
      {pluginConfig.conditions.map((condition) => (
        <Condition key={condition.id} condition={condition} />
      ))}
    </div>
  );
};

const DebugContainer: FC = () => {
  const [shown, setShown] = useState(false);

  const onButtonClick = () => {
    setShown((prev) => !prev);
  };

  return (
    <Provider store={store}>
      <div className='🐸'>
        <div
          className={cn(
            'rad:transition-all rad:opacity-100 rad:fixed rad:right-0 rad:top-0 rad:z-40 rad:bg-white/60 rad:backdrop-blur-sm rad:text-gray-800 rad:p-4 rad:overflow-auto rad:h-screen',
            {
              'rad:opacity-0 rad:pointer-events-none': !shown,
            },
            css`
              --w-rjv-background-color: transparent;
            `
          )}
        >
          <div className='rad:box-border rad:p-4 rad:overflow-auto'>
            <div className='rad:mb-4 rad:text-sm rad:text-green-800 rad:font-bold'>
              Plugin Debug Menu
              <span className='rad:text-xs'>(Not displayed in production)</span>
            </div>
            <DebugContent />
          </div>
        </div>
        <Button
          onClick={onButtonClick}
          color='warning'
          size='small'
          className='rad:fixed! rad:right-3! rad:bottom-3! rad:z-50!'
        >
          🐛 {PLUGIN_NAME}
        </Button>
      </div>
    </Provider>
  );
};

export default DebugContainer;

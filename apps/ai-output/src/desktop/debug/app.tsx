import styled from '@emotion/styled';
import { Fab } from '@mui/material';
import { store } from '@repo/jotai';
import JsonView from '@uiw/react-json-view';
import { Provider, useAtomValue } from 'jotai';
import { useState } from 'react';
import type { PluginCondition } from '@/schema/plugin-config';
import { pluginConfigAtom } from '../public-state';

const DebugPanel = styled.div<{ visible: boolean }>`
  transition: all 0.3s;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  pointer-events: ${({ visible }) => (visible ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  color: #1f2937;
  padding: 16px;
  overflow: auto;
  height: 100vh;
`;

function Condition({ condition }: { condition: PluginCondition }) {
  return (
    <div>
      <details>
        <summary>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
            {condition.memo || condition.buttonLabel || condition.id}
          </span>
        </summary>
        <JsonView value={{ ...condition }} />
      </details>
    </div>
  );
}

function DebugContent() {
  const pluginConfig = useAtomValue(pluginConfigAtom);
  return (
    <div>
      {pluginConfig.conditions.map((condition) => (
        <Condition key={condition.id} condition={condition} />
      ))}
    </div>
  );
}

function DebugApp() {
  const [shown, setShown] = useState(false);

  return (
    <Provider store={store}>
      <div>
        <DebugPanel visible={shown}>
          <div style={{ boxSizing: 'border-box', padding: '16px', overflow: 'auto' }}>
            <div
              style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: '#166534',
                fontWeight: 'bold',
              }}
            >
              Plugin Debug Menu
              <span style={{ fontSize: '12px' }}>(Not displayed in production)</span>
            </div>
            <DebugContent />
          </div>
        </DebugPanel>
        <Fab
          onClick={() => setShown((prev) => !prev)}
          color='warning'
          size='small'
          style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 50 }}
        >
          🐛
        </Fab>
      </div>
    </Provider>
  );
}

export default DebugApp;

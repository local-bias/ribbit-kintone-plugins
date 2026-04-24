import { PluginCondition } from '@/lib/plugin';
import { store } from '@/lib/store';
import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { Fab } from '@mui/material';
import JsonView from '@uiw/react-json-view';
import { Provider, useAtomValue } from 'jotai';
import { memo, useState, type FC } from 'react';
import { pluginConfigAtom } from '../public-state';

const ConditionId = styled.div`
  font-size: 14px;
  line-height: 20px;
  color: #1f2937;
  font-weight: 700;
`;

const Condition: FC<{ condition: PluginCondition }> = ({ condition }) => {
  return (
    <div>
      <details>
        <summary>
          <ConditionId>{condition.id}</ConditionId>
        </summary>
        <JsonView value={{ ...condition }} />
      </details>
    </div>
  );
};

const DebugContent: FC = memo(() => {
  const pluginConfig = useAtomValue(pluginConfigAtom);
  return (
    <div>
      {pluginConfig.conditions.map((condition) => (
        <Condition key={condition.id} condition={condition} />
      ))}
    </div>
  );
});

const panelBaseStyles = css`
  --w-rjv-background-color: transparent;
  transition: opacity 0.15s;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 40;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  color: #1f2937;
  padding: 16px;
  overflow: auto;
  height: 100vh;
`;

const panelHiddenStyles = css`
  opacity: 0;
  pointer-events: none;
`;

const PanelInner = styled.div`
  box-sizing: border-box;
  padding: 16px;
  overflow: auto;
`;

const PanelTitle = styled.div`
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 20px;
  color: #166534;
  font-weight: 700;
`;

const PanelSubtitle = styled.span`
  font-size: 12px;
  line-height: 16px;
`;

const FabContainer = styled.div`
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 50;
`;

const DebugContainer: FC = () => {
  const [shown, setShown] = useState(false);

  const onButtonClick = () => {
    setShown((prev) => !prev);
  };

  return (
    <Provider store={store}>
      <div className='🐸'>
        <div className={shown ? panelBaseStyles : `${panelBaseStyles} ${panelHiddenStyles}`}>
          <PanelInner>
            <PanelTitle>
              Plugin Debug Menu
              <PanelSubtitle>(Not displayed in production)</PanelSubtitle>
            </PanelTitle>
            <DebugContent />
          </PanelInner>
        </div>
        <FabContainer>
          <Fab onClick={onButtonClick} color='warning' size='small'>
            🐛
          </Fab>
        </FabContainer>
      </div>
    </Provider>
  );
};

export default DebugContainer;

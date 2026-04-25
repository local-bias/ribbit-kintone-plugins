import styled from '@emotion/styled';
import { GripVerticalIcon } from 'lucide-react';
import * as React from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

const StyledPanelGroup = styled(ResizablePrimitive.PanelGroup)`
  display: flex;
  height: 100%;
  width: 100%;

  &[data-panel-group-direction='vertical'] {
    flex-direction: column;
  }
`;

function ResizablePanelGroup(props: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return <StyledPanelGroup data-slot='resizable-panel-group' {...props} />;
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot='resizable-panel' {...props} />;
}

const StyledPanelResizeHandle = styled(ResizablePrimitive.PanelResizeHandle)`
  position: relative;
  display: flex;
  width: 1px;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
  outline: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    left: 50%;
    width: 4px;
    transform: translateX(-50%);
  }

  &:focus-visible {
    box-shadow: 0 0 0 1px #1976d2;
  }

  &[data-panel-group-direction='vertical'] {
    height: 1px;
    width: 100%;

    &::after {
      left: 0;
      height: 4px;
      width: 100%;
      transform: translateX(0) translateY(-50%);
    }

    & > div {
      transform: rotate(90deg);
    }
  }
`;

const HandleIndicator = styled.div`
  z-index: 10;
  display: flex;
  height: 16px;
  width: 12px;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  border: 1px solid #e0e0e0;
  background-color: #e0e0e0;
`;

const StyledGripIcon = styled(GripVerticalIcon)`
  width: 10px;
  height: 10px;
`;

function ResizableHandle({
  withHandle,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <StyledPanelResizeHandle data-slot='resizable-handle' {...props}>
      {withHandle && (
        <HandleIndicator>
          <StyledGripIcon />
        </HandleIndicator>
      )}
    </StyledPanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

'use client';

import { css } from '@emotion/css';
import { cn } from '@repo/utils';
import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      css`
        display: flex;
        height: 100%;
        width: 100%;

        &[data-panel-group-direction='vertical'] {
          flex-direction: column;
        }
      `,
      className
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      css`
        position: relative;
        display: flex;
        width: 1px;
        align-items: center;
        justify-content: center;
        background-color: var(--🐸border);

        &:after {
          content: '';
          position: absolute;
          top: 0px;
          bottom: 0px;
          left: 50%;
          width: 4px;
          transform: translateX(-50%);
        }

        &:focus-visible {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        &[data-panel-group-direction='vertical'] {
          height: 1px;
          width: 100%;

          &:after {
            top: 50%;
            left: 0px;
            right: 0px;
            width: 100%;
            height: 4px;
            transform: translateY(-50%), translateX(0), rotate(90deg);
          }
        }
      `,
      className
    )}
    {...props}
  >
    {withHandle && (
      <div
        className={css`
          z-index: 10;
          display: flex;
          height: 16px;
          width: 12px;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border-color: 1px solid var(--🐸border);
          background-color: var(--🐸border);
        `}
      >
        <GripVertical
          className={css`
            width: 10px;
            height: 10px;
          `}
        />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };

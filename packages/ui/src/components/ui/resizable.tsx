import * as React from 'react';
import { GripVerticalIcon } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@repo/utils';

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot='resizable-panel-group'
      className={cn(
        'rui:flex rui:h-full rui:w-full rui:data-[panel-group-direction=vertical]:flex-col',
        className
      )}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot='resizable-panel' {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot='resizable-handle'
      className={cn(
        'rui:bg-border rui:focus-visible:ring-ring rui:relative rui:flex rui:w-px rui:items-center rui:justify-center rui:after:absolute rui:after:inset-y-0 rui:after:left-1/2 rui:after:w-1 rui:after:-translate-x-1/2 rui:focus-visible:ring-1 rui:focus-visible:ring-offset-1 rui:focus-visible:outline-hidden rui:data-[panel-group-direction=vertical]:h-px rui:data-[panel-group-direction=vertical]:w-full rui:data-[panel-group-direction=vertical]:after:left-0 rui:data-[panel-group-direction=vertical]:after:h-1 rui:data-[panel-group-direction=vertical]:after:w-full rui:data-[panel-group-direction=vertical]:after:translate-x-0 rui:data-[panel-group-direction=vertical]:after:-translate-y-1/2 rui:[&[data-panel-group-direction=vertical]>div]:rotate-90',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className='rui:bg-border rui:z-10 rui:flex rui:h-4 rui:w-3 rui:items-center rui:justify-center rui:rounded-xs rui:border'>
          <GripVerticalIcon className='rui:size-2.5' />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

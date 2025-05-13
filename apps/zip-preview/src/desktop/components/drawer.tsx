import { PluginErrorBoundary } from '@/components/error-boundary';
import { Drawer as MuiDrawer } from '@mui/material';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@repo/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { handleDrawerCloseAtom, showDrawerAtom } from '../states/drawer';
import PaneDetails from './pane-details';
import PaneMain from './pane-main';

export default function Drawer() {
  const open = useAtomValue(showDrawerAtom);
  const onClose = useSetAtom(handleDrawerCloseAtom);

  return (
    <div>
      <MuiDrawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{ paper: { className: 'rad:w-[80svw]' } }}
      >
        <PluginErrorBoundary>
          <div className='🐸 rad:overflow-auto rad:h-full rad:max-h-screen'>
            <ResizablePanelGroup direction='horizontal'>
              <ResizablePanel defaultSize={75}>
                <PaneMain />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} className=''>
                <PaneDetails />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </PluginErrorBoundary>
      </MuiDrawer>
    </div>
  );
}

import { PluginErrorBoundary } from '@/components/error-boundary';
import { Drawer as MuiDrawer } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { handleDrawerCloseAtom, showDrawerAtom } from '../public-state';
import ZipPreview from './zip-preview';

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
            <ZipPreview />
            {/* <ResizablePanelGroup direction='horizontal'>
              <ResizablePanel defaultSize={75}>
                <ZipPreview />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} className=''>
                <FileDetails />
              </ResizablePanel>
            </ResizablePanelGroup> */}
          </div>
        </PluginErrorBoundary>
      </MuiDrawer>
    </div>
  );
}

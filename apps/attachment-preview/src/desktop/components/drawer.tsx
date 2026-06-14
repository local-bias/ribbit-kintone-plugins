import { Drawer as MuiDrawer } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { showDrawerAtom } from '../public-state';
import { handleDrawerCloseAtom } from '../states/drawer';
import Footer from './footer';
import Header from './header';
import Preview from './preview';

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
          <div className='🐸 rad:h-full rad:max-h-screen rad:grid rad:grid-rows-[auto_1fr_auto] rad:overflow-hidden'>
            <Header />
            <div className='rad:overflow-auto'>
              <Preview />
            </div>
            <Footer />
          </div>
        </PluginErrorBoundary>
      </MuiDrawer>
    </div>
  );
}

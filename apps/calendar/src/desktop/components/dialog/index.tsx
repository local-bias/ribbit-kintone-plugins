import styled from '@emotion/styled';
import { Dialog, DialogContent } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAtomValue, useSetAtom } from 'jotai';
import { FCX, Suspense } from 'react';
import { dialogShownAtom, handleDialogCloseAtom } from '../../states/dialog';
import FooterActions from './dialog-actions';
import FixedButtons from './fixed-buttons';
import DialogInputs from './inputs';

const Component: FCX = ({ className }) => {
  const open = useAtomValue(dialogShownAtom);
  const onDialogClose = useSetAtom(handleDialogCloseAtom);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onDialogClose} maxWidth='sm' fullWidth className={className}>
        <DialogContent className='🐸 content'>
          <Suspense>
            <FixedButtons />
            <DialogInputs />
          </Suspense>
        </DialogContent>
        <FooterActions onDialogClose={onDialogClose} />
      </Dialog>
    </LocalizationProvider>
  );
};

const StyledComponent = styled(Component)`
  .content {
    position: relative;
  }
`;

export default StyledComponent;

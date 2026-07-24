import SaveIcon from '@mui/icons-material/Save';
import { Button, DialogActions } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';
import { handleDialogSubmitAtom } from '../../states/dialog';
import { loadingAtom } from '../../states/kintone';

const Component: FC<{ onDialogClose: () => void }> = ({ onDialogClose }) => {
  const loading = useAtomValue(loadingAtom);
  const handleDialogSubmit = useSetAtom(handleDialogSubmitAtom);

  return (
    <DialogActions>
      <Button color='inherit' variant='contained' onClick={onDialogClose}>
        キャンセル
      </Button>
      <Button
        loading={loading}
        loadingPosition='start'
        startIcon={<SaveIcon />}
        onClick={handleDialogSubmit}
        variant='contained'
      >
        決定
      </Button>
    </DialogActions>
  );
};

export default Component;

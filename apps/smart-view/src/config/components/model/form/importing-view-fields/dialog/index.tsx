import { CircularProgress, Dialog, DialogTitle } from '@mui/material';
import { useAtom } from 'jotai';
import { type FCX, Suspense } from 'react';
import { t } from '@/lib/i18n';
import { listViewDialogShownAtom } from '../../../../../states/importing-view-fields';
import Content from './content';

const Component: FCX = () => {
  const [open, setOpen] = useAtom(listViewDialogShownAtom);

  const onDialogClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={onDialogClose}>
      <DialogTitle>{t('config.app.form.importViewFields.dialog.title')}</DialogTitle>
      <Suspense fallback={<CircularProgress />}>
        <Content />
      </Suspense>
    </Dialog>
  );
};

export default Component;

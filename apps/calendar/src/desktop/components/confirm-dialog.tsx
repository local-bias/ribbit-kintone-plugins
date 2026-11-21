import { t } from '@/lib/i18n-plugin';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useRef } from 'react';
import { answerConfirmAtom, confirmStateAtom } from '../states/confirm';

export default function ConfirmDialog() {
  const state = useAtomValue(confirmStateAtom);
  const answer = useSetAtom(answerConfirmAtom);
  // 閉じるアニメーションの間も文言が消えないよう、最後に表示した内容を保持する
  const lastStateRef = useRef(state);
  if (state) {
    lastStateRef.current = state;
  }
  const shown = state ?? lastStateRef.current;

  return (
    <Dialog open={!!state} onClose={() => answer(false)} maxWidth='xs' fullWidth>
      <DialogTitle>{shown?.title}</DialogTitle>
      <DialogContent className='🐸'>
        <p className='rad:whitespace-pre-wrap rad:text-sm'>{shown?.message}</p>
      </DialogContent>
      <DialogActions>
        <Button color='inherit' onClick={() => answer(false)}>
          {t('desktop.confirm.cancel')}
        </Button>
        <Button
          variant='contained'
          color={shown?.destructive ? 'error' : 'primary'}
          onClick={() => answer(true)}
          autoFocus
        >
          {t('desktop.confirm.ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

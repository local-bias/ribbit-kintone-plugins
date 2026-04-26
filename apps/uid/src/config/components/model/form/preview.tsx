import styled from '@emotion/styled';
import CasinoIcon from '@mui/icons-material/Casino';
import { Button, IconButton, TextField } from '@mui/material';
import { useAtomValue } from 'jotai';
import { type FC, useEffect, useState } from 'react';
import { selectedConditionAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getId } from '@/lib/utils';

const PreviewContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Preview: FC = () => {
  const condition = useAtomValue(selectedConditionAtom);
  const [value, setValue] = useState('');
  const reroll = () => setValue(getId({ condition, record: {} }));

  useEffect(() => {
    setValue(getId({ condition, record: {} }));
  }, [condition]);

  return (
    <PreviewContainer>
      <TextField
        label={t('config.condition.preview.label')}
        value={value}
        variant='outlined'
        sx={{ width: '400px' }}
      />
      <Button
        variant='contained'
        color='primary'
        size='large'
        onClick={reroll}
        startIcon={<CasinoIcon />}
      >
        {t('config.condition.preview.rerollButton.label')}
      </Button>
    </PreviewContainer>
  );
};

export default Preview;

import { getConditionPropertyAtom } from '@/config/states/plugin';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useAtom } from 'jotai';
import { FC } from 'react';

/**
 * 表示画面の選択フォーム
 */
const DisplayScreensForm: FC = () => {
  const [displayScreens, setDisplayScreens] = useAtom(getConditionPropertyAtom('displayScreens'));

  const handleChange = (screen: 'index' | 'show' | 'edit') => (_: unknown, checked: boolean) => {
    setDisplayScreens({
      ...displayScreens,
      [screen]: checked,
    });
  };

  return (
    <FormGroup>
      <FormControlLabel
        control={<Checkbox checked={displayScreens.index} onChange={handleChange('index')} />}
        label='一覧画面'
      />
      <FormControlLabel
        control={<Checkbox checked={displayScreens.show} onChange={handleChange('show')} />}
        label='詳細画面'
      />
      <FormControlLabel
        control={<Checkbox checked={displayScreens.edit} onChange={handleChange('edit')} />}
        label='編集画面'
      />
    </FormGroup>
  );
};

export default DisplayScreensForm;

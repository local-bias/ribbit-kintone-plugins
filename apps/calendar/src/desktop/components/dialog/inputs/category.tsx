import { t } from '@/lib/i18n-plugin';
import { MenuItem, TextField } from '@mui/material';
import { produce } from 'immer';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC, memo } from 'react';
import { getEventColors } from '../../../actions';
import { dialogPropsAtom } from '../../../states/dialog';
import {
  appPropertiesAtom,
  calendarEventCategoryAtom,
  pluginConditionAtom,
} from '../../../states/kintone';
import { DEFAULT_COLORS } from '../../../static';

const handleCategoryChangeAtom = atom(
  null,
  async (get, set, event: React.ChangeEvent<HTMLInputElement>) => {
    const category = event.target.value;
    const condition = get(pluginConditionAtom);
    const properties = await get(appPropertiesAtom);
    if (!condition) {
      return;
    }

    set(dialogPropsAtom, (current) =>
      produce(current, (draft) => {
        draft.event.category = category;
        const colors = getEventColors({
          value: category,
          condition,
          properties,
        });
        draft.event.color = colors.color;
        draft.event.backgroundColor = colors.backgroundColor;
        draft.event.borderColor = colors.borderColor;
        draft.event.textColor = colors.textColor;
      })
    );
  }
);

const Component: FC<{ category?: string; categories: string[]; }> = memo(
  ({ category, categories }) => {
    const condition = useAtomValue(pluginConditionAtom);
    const colors = condition?.colors ?? DEFAULT_COLORS;
    const onCategoryChange = useSetAtom(handleCategoryChangeAtom);

    return (
      <div>
        <TextField
          variant='outlined'
          size='small'
          sx={{ width: '200px' }}
          color='primary'
          select
          label={t('desktop.dialog.category')}
          value={category || ''}
          onChange={onCategoryChange}
        >
          {categories.map((category, i) => (
            <MenuItem key={category} value={category}>
              <span
                style={{
                  width: '1em',
                  height: '1em',
                  marginRight: '0.5em',
                  borderRadius: '9999px',
                  backgroundColor: colors[i % colors.length],
                }}
              ></span>
              {category}
            </MenuItem>
          ))}
        </TextField>
      </div>
    );
  }
);

const Container: FC = () => {
  const props = useAtomValue(dialogPropsAtom);
  const categories = useAtomValue(calendarEventCategoryAtom);

  if (!categories) {
    return null;
  }

  return <Component category={props.event.category} categories={categories} />;
};

export default Container;

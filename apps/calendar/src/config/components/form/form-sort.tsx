import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { sortableFieldsAtom } from '@/config/states/kintone';
import { calendarSortState, sortOrderState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { type EventSortOrder, EventSortOrderSchema } from '@/schema/plugin-config';
import { MenuItem, TextField } from '@mui/material';
import { useAtom } from 'jotai';

const SORT_ORDER_LABEL_KEYS = {
  asc: 'config.form.sortOrder.asc',
  desc: 'config.form.sortOrder.desc',
} as const satisfies Record<EventSortOrder, Parameters<typeof t>[0]>;

/** 同じ時刻の予定の並び順を決めるフィールドと、その並び順 */
export default function FormSort() {
  const [fieldCode, setFieldCode] = useAtom(calendarSortState);
  const [sortOrder, setSortOrder] = useAtom(sortOrderState);

  return (
    <div className='grid gap-4'>
      <JotaiFieldSelect
        // @ts-expect-error 型定義不足
        fieldPropertiesAtom={sortableFieldsAtom}
        onChange={setFieldCode}
        fieldCode={fieldCode}
        placeholder={t('config.form.selectField')}
      />
      <TextField
        label={t('config.form.sortOrder')}
        select
        variant='outlined'
        color='primary'
        disabled={!fieldCode}
        onChange={(event) => setSortOrder(EventSortOrderSchema.parse(event.target.value))}
        sx={{ width: '200px' }}
        value={sortOrder}
      >
        {EventSortOrderSchema.options.map((order) => (
          <MenuItem key={order} value={order}>
            {t(SORT_ORDER_LABEL_KEYS[order])}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}

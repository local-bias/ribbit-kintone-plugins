import { calendarDateInputToDateTime } from '@/desktop/date-conversion';
import { DEFAULT_RECURRENCE_FORM, RecurrenceFormInputs } from '@/desktop/components/recurrence-form';
import { buildRRuleString, parseRRuleString, RecurrenceFormState } from '@/desktop/recurrence';
import { dialogEventAtom } from '@/desktop/states/dialog';
import { loginUserAtom, pluginConditionAtom } from '@/desktop/states/kintone';
import { t } from '@/lib/i18n-plugin';
import { FormControlLabel, Switch } from '@mui/material';
import { produce } from 'immer';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';

/** 現在の`dialogEventAtom`の繰り返し設定(無ければ既定値)に`updater`を適用し、
 *  再構築したRRULE文字列を書き戻す。`exceptions`は既存のものを維持する。 */
const handleFormChangeAtom = atom(
  null,
  (get, set, updater: (form: RecurrenceFormState) => RecurrenceFormState) => {
    const event = get(dialogEventAtom);
    if (!event.start) return;
    const { timezone } = get(loginUserAtom);
    const startDt = calendarDateInputToDateTime(event.start, timezone);

    const recurrence = event.extendedProps?.recurrence;
    const currentForm =
      recurrence?.kind === 'master' ? parseRRuleString(recurrence.rrule) : DEFAULT_RECURRENCE_FORM;
    const nextForm = updater(currentForm);
    const rrule = buildRRuleString(nextForm, startDt);

    set(dialogEventAtom, (current) =>
      produce(current, (draft) => {
        const exceptions =
          draft.extendedProps?.recurrence?.kind === 'master' ? draft.extendedProps.recurrence.exceptions : [];
        draft.extendedProps = { recurrence: { kind: 'master', rrule, exceptions } };
      })
    );
  }
);

const handleToggleAtom = atom(null, (get, set, checked: boolean) => {
  if (!checked) {
    set(dialogEventAtom, (current) => produce(current, (draft) => {
      draft.extendedProps = undefined;
    }));
    return;
  }
  set(handleFormChangeAtom, () => DEFAULT_RECURRENCE_FORM);
});

const Component: FC = () => {
  const pluginCondition = useAtomValue(pluginConditionAtom);
  const event = useAtomValue(dialogEventAtom);
  const onToggle = useSetAtom(handleToggleAtom);
  const onFormChange = useSetAtom(handleFormChangeAtom);

  const recurrence = event.extendedProps?.recurrence;

  // 分離済みの1回(override)は繰り返し設定の対象外
  if (!pluginCondition?.enablesRecurrence || recurrence?.kind === 'override') {
    return null;
  }

  const isMaster = recurrence?.kind === 'master';
  const form =
    recurrence?.kind === 'master' ? parseRRuleString(recurrence.rrule) : DEFAULT_RECURRENCE_FORM;

  return (
    <div className='grid gap-2'>
      <FormControlLabel
        control={<Switch checked={isMaster} onChange={(_, checked) => onToggle(checked)} />}
        label={t('desktop.dialog.recurrence.enable')}
      />
      {isMaster && <RecurrenceFormInputs form={form} onChange={onFormChange} />}
    </div>
  );
};

export default Component;

import { FC, Suspense } from 'react';

import { srcAppStatusState } from '@/config/states/kintone';
import { processActionsAtom, processStatusesAtom, triggerEventsAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import {
  JotaiActionMultiSelect,
  JotaiStatusMultiSelect,
} from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useAtom, useAtomValue } from 'jotai';

const PREMIUM_ONLY_TOOLTIP = 'この機能はアプリ間連携プラグイン プラスでのみ利用可能です';
const PREMIUM_ONLY_EVENTS = new Set(['delete', 'process']);

const TRIGGER_EVENT_OPTIONS = [
  { value: 'create', labelKey: 'config.condition.triggerEvents.create' as const },
  { value: 'update', labelKey: 'config.condition.triggerEvents.update' as const },
  { value: 'delete', labelKey: 'config.condition.triggerEvents.delete' as const },
  { value: 'process', labelKey: 'config.condition.triggerEvents.process' as const },
] as const;

const ProcessOptions: FC = () => {
  const processActions = useAtomValue(processActionsAtom);
  const processStatuses = useAtomValue(processStatusesAtom);
  const [, setProcessActions] = useAtom(processActionsAtom);
  const [, setProcessStatuses] = useAtom(processStatusesAtom);

  return (
    <div className='ml-8 mt-2 flex flex-col gap-4'>
      <PluginFormDescription last>
        {t('config.condition.processOptions.description')}
      </PluginFormDescription>
      <JotaiActionMultiSelect
        appStatusAtom={srcAppStatusState}
        actionNames={processActions}
        onChange={(names) => setProcessActions(names)}
        label={t('config.condition.processOptions.actions.label')}
        placeholder={t('config.condition.processOptions.actions.placeholder')}
      />
      <JotaiStatusMultiSelect
        appStatusAtom={srcAppStatusState}
        statusNames={processStatuses}
        onChange={(names) => setProcessStatuses(names)}
        label={t('config.condition.processOptions.statuses.label')}
        placeholder={t('config.condition.processOptions.statuses.placeholder')}
      />
    </div>
  );
};

const Component: FC = () => {
  const [triggerEvents, setTriggerEvents] = useAtom(triggerEventsAtom);
  const currentEvents = triggerEvents ?? ['create', 'update'];
  const isProcessSelected = currentEvents.includes('process');

  const handleChange = (value: string, checked: boolean) => {
    let newEvents: string[];
    if (checked) {
      newEvents = [...currentEvents, value];
    } else {
      newEvents = currentEvents.filter((e) => e !== value);
    }
    // 最低1つは選択されている状態を維持
    if (newEvents.length === 0) return;
    setTriggerEvents(newEvents);
  };

  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.triggerEvents.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.condition.triggerEvents.description')}
      </PluginFormDescription>
      <FormGroup row>
        {TRIGGER_EVENT_OPTIONS.map(({ value, labelKey }) => {
          const isPremiumOnly = PREMIUM_ONLY_EVENTS.has(value);
          const isDisabled =
            isPremiumOnly || (currentEvents.length === 1 && currentEvents.includes(value));

          if (isPremiumOnly) {
            return (
              <Tooltip key={value} title={PREMIUM_ONLY_TOOLTIP}>
                <span>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentEvents.includes(value)}
                        onChange={(_, checked) => handleChange(value, checked)}
                        disabled={isDisabled}
                      />
                    }
                    label={t(labelKey)}
                  />
                </span>
              </Tooltip>
            );
          }

          return (
            <FormControlLabel
              key={value}
              control={
                <Checkbox
                  checked={currentEvents.includes(value)}
                  onChange={(_, checked) => handleChange(value, checked)}
                  disabled={isDisabled}
                />
              }
              label={t(labelKey)}
            />
          );
        })}
      </FormGroup>
      {isProcessSelected && (
        <Suspense fallback={<Skeleton variant='rounded' width='100%' height={120} />}>
          <ProcessOptions />
        </Suspense>
      )}
    </PluginFormSection>
  );
};

const FormTriggerEvents: FC = () => (
  <Suspense fallback={<Skeleton variant='rounded' width='100%' height={80} />}>
    <Component />
  </Suspense>
);

export default FormTriggerEvents;

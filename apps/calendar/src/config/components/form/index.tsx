import { JotaiSwitch } from '@/components/jotai/switch';
import { enablesAllDayState, enablesNoteState, enablesRecurrenceState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FC } from 'react';
import DeleteButton from './condition-delete-button';
import CreateNewView from './create-new-view';
import FormAllday from './form-allday';
import FormCategory from './form-category';
import FormColors from './form-colors';
import DaysOfWeekForm from './form-days-of-week';
import FormEditMode from './form-edit-mode';
import FormInitialView from './form-initial-view';
import FormNote from './form-note';
import FormRecurrence from './form-recurrence';
import FormScheduleEnd from './form-schedule-end';
import FormScheduleStart from './form-schedule-start';
import FormScheduleTitle from './form-schedule-title';
import FormSlotMinmax from './form-slot-minmax';
import FormView from './form-view';
import FirstDayForm from './form-first-day';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.viewSettings.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.section.viewSettings.description')}</PluginFormDescription>
      <div className='flex items-center gap-8'>
        <FormView />
        <CreateNewView />
      </div>
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.editMode.title')}</PluginFormTitle>
      <PluginFormDescription>{t('config.section.editMode.description')}</PluginFormDescription>
      <PluginFormDescription last>
        {t('config.section.editMode.description2')}
      </PluginFormDescription>
      <FormEditMode />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.scheduleTitle.title')}</PluginFormTitle>
      <PluginFormDescription>
        {t('config.section.scheduleTitle.description')}
      </PluginFormDescription>
      <PluginFormDescription last>
        {t('config.section.scheduleTitle.description2')}
      </PluginFormDescription>
      <FormScheduleTitle />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.scheduleStart.title')}</PluginFormTitle>
      <PluginFormDescription>
        {t('config.section.scheduleStart.description')}
      </PluginFormDescription>
      <PluginFormDescription last>
        {t('config.section.scheduleStart.description2')}
      </PluginFormDescription>
      <FormScheduleStart />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.scheduleEnd.title')}</PluginFormTitle>
      <PluginFormDescription>
        {t('config.section.scheduleEnd.description')}
      </PluginFormDescription>
      <PluginFormDescription last>
        {t('config.section.scheduleEnd.description2')}
      </PluginFormDescription>
      <FormScheduleEnd />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.allDay.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.section.allDay.description')}</PluginFormDescription>
      <JotaiSwitch atom={enablesAllDayState} label={t('config.section.allDay.enableLabel')} />
      <FormAllday />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.note.title')}</PluginFormTitle>
      <PluginFormDescription>
        {t('config.section.note.description')}
      </PluginFormDescription>
      <PluginFormDescription last>
        {t('config.section.note.description2')}
      </PluginFormDescription>
      <JotaiSwitch atom={enablesNoteState} label={t('config.section.note.enableLabel')} />
      <FormNote />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.section.recurrence.title')}</PluginFormTitle>
      <PluginFormDescription>{t('config.section.recurrence.description')}</PluginFormDescription>
      <PluginFormDescription last>
        {t('config.section.recurrence.description2')}
      </PluginFormDescription>
      <JotaiSwitch
        atom={enablesRecurrenceState}
        label={t('config.section.recurrence.enableLabel')}
      />
      <FormRecurrence />
    </PluginFormSection>
    <details className='mt-8'>
      <summary className='font-bold text-lg mb-4 cursor-pointer'>{t('config.section.advanced')}</summary>
      <PluginFormSection>
        <PluginFormTitle>{t('config.section.initialView.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.section.initialView.description')}
        </PluginFormDescription>
        <FormInitialView />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.section.slotMinmax.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.section.slotMinmax.description')}
        </PluginFormDescription>
        <FormSlotMinmax />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.section.businessDays.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.section.businessDays.description')}</PluginFormDescription>
        <PluginFormDescription last>
          {t('config.section.businessDays.description2')}
        </PluginFormDescription>
        <DaysOfWeekForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.section.firstDay.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.section.firstDay.description')}</PluginFormDescription>
        <PluginFormDescription last>
          {t('config.section.firstDay.description2')}
        </PluginFormDescription>
        <FirstDayForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.section.category.title')}</PluginFormTitle>
        <PluginFormDescription>
          {t('config.section.category.description')}
        </PluginFormDescription>
        <PluginFormDescription>{t('config.section.category.description2')}</PluginFormDescription>
        <PluginFormDescription last>
          {t('config.section.category.description3')}
        </PluginFormDescription>
        <FormCategory />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.section.colors.title')}</PluginFormTitle>
        <PluginFormDescription>
          {t('config.section.colors.description')}
        </PluginFormDescription>
        <PluginFormDescription last>
          {t('config.section.colors.description2')}
        </PluginFormDescription>
        <FormColors />
      </PluginFormSection>
    </details>
    <DeleteButton />
  </div>
);

export default Component;

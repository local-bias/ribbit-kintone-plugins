import { getRecordDetailUrl } from '@/desktop/record-url';
import { calendarEventsAtom } from '@/desktop/states/calendar';
import {
  closeEventContextMenuAtom,
  eventContextMenuAtom,
  type EventContextMenuState,
} from '@/desktop/states/context-menu';
import {
  changeEventCategoryAtom,
  copyCalendarEventAtom,
  deleteCalendarEventAtom,
  openEventEditorAtom,
} from '@/desktop/states/event-operations';
import {
  calendarEventCategoryAtom,
  categoryFieldPropertyAtom,
  pluginConditionAtom,
} from '@/desktop/states/kintone';
import { DEFAULT_COLORS } from '@/desktop/static';
import { t } from '@/lib/i18n-plugin';
import { Divider, ListItemIcon, ListItemText, ListSubheader, Menu, MenuItem } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { Check, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Suspense } from 'react';

const ICON_CLASS = 'rad:w-4 rad:h-4';

/** 予定の色を決めるカテゴリーのうち、1つの値だけを選べるフィールドの場合のみ変更できる */
function useChangeableCategories(): string[] | null {
  const categories = useAtomValue(calendarEventCategoryAtom);
  const property = useAtomValue(categoryFieldPropertyAtom);
  if (!categories || (property?.type !== 'DROP_DOWN' && property?.type !== 'RADIO_BUTTON')) {
    return null;
  }
  return categories;
}

function CategoryItems({
  currentCategory,
  onSelect,
}: {
  currentCategory: string | undefined;
  onSelect: (category: string) => void;
}) {
  const categories = useChangeableCategories();
  const condition = useAtomValue(pluginConditionAtom);
  const colors = condition?.colors.length ? condition.colors : DEFAULT_COLORS;

  if (!categories) {
    return null;
  }

  return [
    <Divider key='divider' />,
    <ListSubheader key='subheader' sx={{ lineHeight: '32px' }}>
      {t('desktop.contextMenu.changeCategory')}
    </ListSubheader>,
    ...categories.map((category, i) => (
      <MenuItem key={category} dense onClick={() => onSelect(category)}>
        <ListItemIcon>
          <span
            className='rad:inline-block rad:w-3.5 rad:h-3.5 rad:rounded-full'
            style={{ backgroundColor: colors[i % colors.length] }}
          />
        </ListItemIcon>
        <ListItemText>{category}</ListItemText>
        {category === currentCategory && <Check className={ICON_CLASS} />}
      </MenuItem>
    )),
  ];
}

function EventContextMenuItems({ state }: { state: EventContextMenuState }) {
  const events = useAtomValue(calendarEventsAtom);
  const close = useSetAtom(closeEventContextMenuAtom);
  const openEditor = useSetAtom(openEventEditorAtom);
  const copyEvent = useSetAtom(copyCalendarEventAtom);
  const deleteEvent = useSetAtom(deleteCalendarEventAtom);
  const changeCategory = useSetAtom(changeEventCategoryAtom);

  const event = events.find(({ id }) => id === state.eventId);
  if (!event) {
    return null;
  }

  const run = (action: () => unknown) => () => {
    close();
    action();
  };

  return [
    <ListSubheader
      key='title'
      sx={{ lineHeight: '32px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      {event.displayTitle || event.title || t('desktop.calendar.noTitle')}
    </ListSubheader>,
    <MenuItem
      key='detail'
      component='a'
      href={getRecordDetailUrl(state.eventId)}
      onClick={() => close()}
      sx={{ color: 'inherit' }}
    >
      <ListItemIcon>
        <ExternalLink className={ICON_CLASS} />
      </ListItemIcon>
      <ListItemText>{t('desktop.contextMenu.showDetail')}</ListItemText>
    </MenuItem>,
    <MenuItem key='edit' onClick={run(() => openEditor(state))}>
      <ListItemIcon>
        <Pencil className={ICON_CLASS} />
      </ListItemIcon>
      <ListItemText>{t('desktop.contextMenu.edit')}</ListItemText>
    </MenuItem>,
    <MenuItem key='copy' onClick={run(() => copyEvent(event))}>
      <ListItemIcon>
        <Copy className={ICON_CLASS} />
      </ListItemIcon>
      <ListItemText>{t('desktop.contextMenu.copy')}</ListItemText>
    </MenuItem>,
    <CategoryItems
      key='categories'
      currentCategory={event.category}
      onSelect={(category) => {
        close();
        changeCategory({ eventId: state.eventId, category });
      }}
    />,
    <Divider key='divider-delete' />,
    <MenuItem key='delete' onClick={run(() => deleteEvent(state))} sx={{ color: 'error.main' }}>
      <ListItemIcon sx={{ color: 'inherit' }}>
        <Trash2 className={ICON_CLASS} />
      </ListItemIcon>
      <ListItemText>{t('desktop.contextMenu.delete')}</ListItemText>
    </MenuItem>,
  ];
}

/** カレンダー上の予定を右クリックしたときに表示するメニュー */
export default function EventContextMenu() {
  const state = useAtomValue(eventContextMenuAtom);
  const close = useSetAtom(closeEventContextMenuAtom);

  return (
    <Menu
      open={!!state}
      onClose={() => close()}
      anchorReference='anchorPosition'
      anchorPosition={state ? { top: state.y, left: state.x } : undefined}
      slotProps={{ list: { dense: true, className: '🐸', sx: { minWidth: 220 } } }}
    >
      {state && (
        <Suspense fallback={null}>
          <EventContextMenuItems state={state} />
        </Suspense>
      )}
    </Menu>
  );
}

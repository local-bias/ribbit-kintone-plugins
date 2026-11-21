import { type Assignee, isAssigneeKeyShown, UNASSIGNED_KEY } from '@/desktop/assignee';
import {
  assigneeOptionsAtom,
  loadUserIconsAtom,
  resetDisplayingAssigneesAtom,
  showOnlyAssigneeAtom,
  toggleDisplayingAssigneeAtom,
  userIconUrlsAtom,
} from '@/desktop/states/assignee';
import { assigneeFieldPropertyAtom, pluginConditionAtom } from '@/desktop/states/kintone';
import { displayingAssigneesAtom } from '@/desktop/states/sidebar';
import { t } from '@/lib/i18n-plugin';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { Eye, EyeOff, Focus, UserRound } from 'lucide-react';
import { type ReactNode, Suspense, useEffect, useId } from 'react';

const STATE_ICON_CLASS = 'rad:w-4 rad:h-4 rad:shrink-0 rad:text-foreground/50';

/** 先頭の1文字(絵文字やサロゲートペアの文字を壊さないよう、コードポイント単位で取り出す) */
const getInitial = (label: string) => Array.from(label)[0] ?? '';

/** ユーザーのアバター。アイコンを取得できない場合は頭文字を表示する */
function Avatar({ assignee }: { assignee: Assignee }) {
  const urls = useAtomValue(userIconUrlsAtom);
  const url = urls[assignee.key];

  if (url) {
    return (
      <img
        src={url}
        alt=''
        className='rad:w-5 rad:h-5 rad:rounded-full rad:object-cover rad:shrink-0'
      />
    );
  }
  return (
    <span
      aria-hidden
      className='rad:flex rad:w-5 rad:h-5 rad:rounded-full rad:bg-muted rad:text-[10px] rad:items-center rad:justify-center rad:text-foreground/70 rad:shrink-0'
    >
      {getInitial(assignee.label)}
    </span>
  );
}

function AssigneeLeading({ assignee }: { assignee: Assignee }) {
  if (assignee.isUser) {
    return <Avatar assignee={assignee} />;
  }
  return (
    <UserRound strokeWidth={1.5} className='rad:w-5 rad:h-5 rad:shrink-0 rad:text-foreground/50' />
  );
}

/**
 * 担当者1件分の行
 *
 * kintoneのbutton向けの既定スタイルはレイヤー外の打ち消しクラスで外し、見た目は内側のspanに指定する
 */
function AssigneeItem(props: {
  itemKey: string;
  label: string;
  leading: ReactNode;
  shown: boolean;
}) {
  const { itemKey, label, leading, shown } = props;
  const toggle = useSetAtom(toggleDisplayingAssigneeAtom);
  const showOnly = useSetAtom(showOnlyAssigneeAtom);
  const showOnlyLabel = t('desktop.sidebar.showOnlyOf', label);

  return (
    <li className='rad:flex rad:items-center rad:rounded-md rad:transition-colors rad:hover:bg-muted'>
      <button
        type='button'
        aria-pressed={shown}
        title={label}
        onClick={() => toggle(itemKey)}
        className='ribbit-calendar-plain-button rad:flex-1 rad:min-w-0'
      >
        <span
          className={cn(
            'rad:flex rad:items-center rad:gap-2 rad:py-1 rad:pl-2 rad:text-sm rad:text-foreground',
            { 'rad:text-foreground/30': !shown }
          )}
        >
          <span className={cn('rad:flex', { 'rad:opacity-30': !shown })}>{leading}</span>
          <span className='rad:truncate rad:flex-1'>{label}</span>
          {shown ? (
            <Eye strokeWidth={1.5} className={STATE_ICON_CLASS} />
          ) : (
            <EyeOff strokeWidth={1.5} className={STATE_ICON_CLASS} />
          )}
        </span>
      </button>
      <button
        type='button'
        aria-label={showOnlyLabel}
        title={showOnlyLabel}
        onClick={() => showOnly(itemKey)}
        className='ribbit-calendar-plain-button'
      >
        <span className='rad:flex rad:p-1.5 rad:text-foreground/50 rad:transition-colors rad:hover:text-primary'>
          <Focus strokeWidth={1.5} className='rad:w-3.5 rad:h-3.5' />
        </span>
      </button>
    </li>
  );
}

function AssigneeTitle({ id }: { id: string }) {
  const property = useAtomValue(assigneeFieldPropertyAtom);
  return <span id={id}>{property?.label ?? t('desktop.sidebar.assignee')}</span>;
}

function ResetButton() {
  const filter = useAtomValue(displayingAssigneesAtom);
  const reset = useSetAtom(resetDisplayingAssigneesAtom);
  if (filter === null) {
    return null;
  }
  return (
    <button type='button' onClick={() => reset()} className='ribbit-calendar-plain-button'>
      <span className='rad:text-primary'>{t('desktop.sidebar.showAll')}</span>
    </button>
  );
}

function AssigneeList({ labelledBy }: { labelledBy: string }) {
  const { assignees, hasUnassigned } = useAtomValue(assigneeOptionsAtom);
  const filter = useAtomValue(displayingAssigneesAtom);
  const loadUserIcons = useSetAtom(loadUserIconsAtom);

  useEffect(() => {
    loadUserIcons(assignees);
  }, [assignees, loadUserIcons]);

  return (
    <ul aria-labelledby={labelledBy} className='ribbit-calendar-plain-list'>
      {assignees.map((assignee) => (
        <AssigneeItem
          key={assignee.key}
          itemKey={assignee.key}
          label={assignee.label}
          shown={isAssigneeKeyShown(assignee.key, filter)}
          leading={<AssigneeLeading assignee={assignee} />}
        />
      ))}
      {hasUnassigned && (
        <AssigneeItem
          itemKey={UNASSIGNED_KEY}
          label={t('desktop.sidebar.unassigned')}
          shown={isAssigneeKeyShown(UNASSIGNED_KEY, filter)}
          leading={<span className='rad:inline-block rad:w-5 rad:h-5' />}
        />
      )}
    </ul>
  );
}

/** サイドバーの担当者による絞り込み(担当者のフィールドが設定されている場合のみ表示) */
export default function SidebarAssignees() {
  const condition = useAtomValue(pluginConditionAtom);
  const titleId = useId();
  if (!condition?.calendarEvent.assigneeField) {
    return null;
  }

  return (
    <div>
      <div className='rad:flex rad:items-center rad:justify-between rad:text-xs rad:text-foreground/70'>
        <Suspense fallback={<span id={titleId}>{t('desktop.sidebar.assignee')}</span>}>
          <AssigneeTitle id={titleId} />
        </Suspense>
        <ResetButton />
      </div>
      <div className='rad:py-3'>
        <AssigneeList labelledBy={titleId} />
      </div>
    </div>
  );
}

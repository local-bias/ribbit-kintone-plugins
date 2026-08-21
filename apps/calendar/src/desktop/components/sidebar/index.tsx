import { useIsMobile } from '@/desktop/hooks/use-mobile';
import { sidebarExpandedAtom, toggleSidebarExpandedAtom } from '@/desktop/states/sidebar';
import { t } from '@/lib/i18n-plugin';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import SidebarContent from './content';

/**
 * 開閉ハンドルを構成する縦棒(8px)。通常時は上下2本が隙間なく積まれて1本の16pxの棒に見え、
 * ホバー/フォーカス時に上下が逆向きに傾いて「<」「>」を形作る。
 *
 * Tailwindはソース上のクラス名を文字列としてそのまま探すため、傾きのクラスは
 * テンプレートリテラルで組み立てず、必ずリテラルで書くこと。
 */
const HANDLE_BAR =
  'rad:h-2 rad:w-0.5 rad:rounded-full rad:bg-foreground/30 rad:transition-[transform,background-color] rad:duration-200 rad:ease-out rad:group-hover:bg-foreground/60 rad:group-focus-visible:bg-foreground/60';

/** 「<」= 上の棒を時計回り + 下の棒を反時計回り(2本の接合点が左を向く) */
const HANDLE_CHEVRON_LEFT = {
  upper: 'rad:group-hover:rotate-[20deg] rad:group-focus-visible:rotate-[20deg]',
  lower: 'rad:group-hover:rotate-[-20deg] rad:group-focus-visible:rotate-[-20deg]',
} as const;

/** 「>」= 「<」の左右反転 */
const HANDLE_CHEVRON_RIGHT = {
  upper: HANDLE_CHEVRON_LEFT.lower,
  lower: HANDLE_CHEVRON_LEFT.upper,
} as const;

export default function CalendarSidebar() {
  const isMobile = useIsMobile();
  const expanded = useAtomValue(sidebarExpandedAtom);
  const toggle = useSetAtom(toggleSidebarExpandedAtom);

  // 開いている状態のハンドルは「閉じる(<)」、閉じている状態のハンドルは「開く(>)」を表す
  const chevron = expanded ? HANDLE_CHEVRON_LEFT : HANDLE_CHEVRON_RIGHT;

  return (
    <div
      className={cn(
        'rad:relative rad:border-r rad:border-r-border rad:w-8 rad:bg-background rad:shrink-0 rad:transition-[width] rad:duration-200 rad:ease-in-out',
        {
          'rad:hidden': isMobile,
          'rad:w-64': expanded,
        }
      )}
    >
      <div className='rad:sticky rad:top-12 rad:min-h-[calc(100svh-240px)]'>
        <div className='rad:overflow-hidden'>
          <div
            className={cn('rad:w-64 rad:p-4 rad:transition-opacity rad:duration-150', {
              'rad:opacity-0 rad:pointer-events-none': !expanded,
            })}
          >
            <SidebarContent />
          </div>
        </div>
        <button
          type='button'
          onClick={toggle}
          aria-label={t(expanded ? 'desktop.sidebar.collapse' : 'desktop.sidebar.expand')}
          aria-expanded={expanded}
          className='ribbit-calendar-sidebar-handle rad:group rad:absolute rad:top-1/2 rad:-right-4 rad:z-10 rad:flex rad:h-8 rad:w-6 rad:-translate-y-1/2 rad:flex-col rad:items-center rad:justify-center'
        >
          <span className={cn(HANDLE_BAR, chevron.upper)} />
          <span className={cn(HANDLE_BAR, 'rad:-mt-px', chevron.lower)} />
        </button>
      </div>
    </div>
  );
}

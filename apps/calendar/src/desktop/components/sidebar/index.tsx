import { useIsMobile } from '@/desktop/hooks/use-mobile';
import { sidebarExpandedAtom, toggleSidebarExpandedAtom } from '@/desktop/states/sidebar';
import { t } from '@/lib/i18n-plugin';
import { Button } from '@/lib/components/ui/button';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import SidebarContent from './content';

export default function CalendarSidebar() {
  const isMobile = useIsMobile();
  const expanded = useAtomValue(sidebarExpandedAtom);
  const toggle = useSetAtom(toggleSidebarExpandedAtom);

  return (
    <div
      className={cn(
        'relative border-r border-r-border w-8 bg-background shrink-0 transition-[width] duration-200 ease-in-out',
        {
          hidden: isMobile,
          'w-64': expanded,
        }
      )}
    >
      <Button
        variant='outline'
        size='icon'
        onClick={toggle}
        aria-label={t(expanded ? 'desktop.sidebar.collapse' : 'desktop.sidebar.expand')}
        className='absolute -right-4 top-3 z-10 h-8 w-8 rounded-full bg-background shadow-sm hover:bg-accent'
      >
        {expanded ? <PanelLeftClose className='w-4 h-4' /> : <PanelLeftOpen className='w-4 h-4' />}
      </Button>
      <div className='sticky top-12 min-h-[calc(100svh-240px)] overflow-hidden'>
        <div
          className={cn('w-64 p-4 transition-opacity duration-150', {
            'opacity-0 pointer-events-none': !expanded,
          })}
        >
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}

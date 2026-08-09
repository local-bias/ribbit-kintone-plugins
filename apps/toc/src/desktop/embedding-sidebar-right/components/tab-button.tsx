import { sidebarSelectedAtom, toggleSidebarAtom } from '@/desktop/state';
import { useAtomValue, useSetAtom } from 'jotai';
import { TabButton as StyledTabButton } from '@/desktop/components/toc-components';

export default function TabButton() {
  const selected = useAtomValue(sidebarSelectedAtom);
  const toggleSidebar = useSetAtom(toggleSidebarAtom);

  const onClick = () => {
    toggleSidebar();
  };

  return (
    <StyledTabButton
      type='button'
      title='目次'
      onClick={onClick}
      $selected={selected}
      aria-label='目次を表示/非表示'
      aria-pressed={selected}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
        <path
          fill='currentColor'
          d='M3 9h14V7H3v2m0 4h14v-2H3v2m0 4h14v-2H3v2m16 0h2v-2h-2v2m0-10v2h2V7h-2m0 6h2v-2h-2v2Z'
        />
      </svg>
    </StyledTabButton>
  );
}

import TOC from '@/desktop/components/toc';
import TOCTitle from '@/desktop/components/toc-title';
import { SidebarContentWrapper } from '@/desktop/components/toc-components';
import { sidebarSelectedAtom } from '@/desktop/state';
import { useAtomValue } from 'jotai';

export default function SidebarContent() {
  const selected = useAtomValue(sidebarSelectedAtom);

  if (!selected) {
    return null;
  }

  return (
    <SidebarContentWrapper>
      <TOCTitle />
      <TOC />
    </SidebarContentWrapper>
  );
}

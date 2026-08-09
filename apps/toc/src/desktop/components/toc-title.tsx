import { pluginConfigAtom } from '@/desktop/state';
import { useAtomValue } from 'jotai';
import { TableOfContents } from 'lucide-react';
import { TOCTitleContainer } from './toc-components';

export default function TOCTitle() {
  const { common } = useAtomValue(pluginConfigAtom);

  return (
    <TOCTitleContainer>
      <TableOfContents />
      {common.tocTitle}
    </TOCTitleContainer>
  );
}

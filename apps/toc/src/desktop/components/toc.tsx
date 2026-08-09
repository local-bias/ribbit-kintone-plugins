import { onTocItemClick } from '@/desktop/actions';
import { activeSpaceIdAtom } from '@/desktop/heading-observer';
import { pluginConfigAtom } from '@/desktop/state';
import { useAtomValue } from 'jotai';
import { TOCContainer, TOCItem } from './toc-components';

export default function TOC() {
  const { conditions } = useAtomValue(pluginConfigAtom);
  const activeSpaceId = useAtomValue(activeSpaceIdAtom);

  const onItemClick = (e: React.MouseEvent<HTMLLIElement>) => {
    onTocItemClick(e.nativeEvent);
  };

  return (
    <TOCContainer>
      {conditions.map((c, i) => (
        <TOCItem
          key={i}
          className='ribbit-toc-heading'
          data-space-id={c.spaceId}
          onClick={onItemClick}
          $color={c.color}
          $active={activeSpaceId === c.spaceId}
        >
          {c.label}
        </TOCItem>
      ))}
    </TOCContainer>
  );
}

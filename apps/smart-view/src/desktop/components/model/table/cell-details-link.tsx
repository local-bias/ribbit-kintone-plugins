import { pluginConditionAtom } from '@/desktop/states/plugin';
import { getQueryString } from '@/lib/cybozu';
import { isMobile } from '@konomi-app/kintone-utilities';
import { useAtomValue } from 'jotai';
import { DocumentIcon } from '../../ui/document-icon';

type Props = Readonly<{ recordId: string }>;

export default function TableCellDetailsLink({ recordId }: Props) {
  const condition = useAtomValue(pluginConditionAtom)!;

  const queryString = getQueryString();

  const lView = `&l.view=${condition.viewId}`;
  const lQuery = queryString ? `&l.q=${queryString}` : '';

  return (
    <a
      href={`${location.pathname}show${isMobile() ? '?' : '#'}record=${recordId}${lView}${lQuery}`}
      {...(condition.isOpenInNewTab ? { target: '_blank' } : {})}
    >
      <DocumentIcon />
    </a>
  );
}

import {
  cardImageFieldCodeAtom,
  cardViewFieldsAtom,
  pluginConditionAtom,
} from '@/desktop/states/plugin';
import { TableRow } from '@/desktop/static';
import { getQueryString } from '@/lib/cybozu';
import styled from '@emotion/styled';
import { isMobile, kintoneAPI } from '@konomi-app/kintone-utilities';
import { Card, IconButton, Tooltip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { DocumentIcon } from '../../ui/document-icon';
import ViewCardField from './field';
import ViewCardImage from './image';

type FileInfo = kintoneAPI.field.File['value'][number];

type Props = {
  record: TableRow;
  className?: string;
};

function ViewCardComponent({ className, record }: Props) {
  const condition = useAtomValue(pluginConditionAtom)!;
  const imageFieldCode = useAtomValue(cardImageFieldCodeAtom);
  const viewFields = useAtomValue(cardViewFieldsAtom) ?? [];

  const files = imageFieldCode ? (record.record[imageFieldCode]?.value as FileInfo[]) ?? [] : [];

  let image: FileInfo | null = null;

  for (const file of files) {
    if (/^image\//.test(file.contentType)) {
      image = file;
      break;
    }
  }

  return (
    <Card className={className}>
      <ViewCardImage file={image} />
      <div className='🐸right'>
        <div className='🐸fields'>
          {viewFields.map((field, i) => {
            return (
              <ViewCardField key={i} field={record.record[field.fieldCode]} fieldCode={field.fieldCode} />
            );
          })}
        </div>
        <div className='🐸actions'>
          <a
            href={`${location.pathname}show${isMobile() ? '?' : '#'}record=${record.record.$id.value
              }&l.view=${condition.viewId}&l.q${getQueryString() ? `=${getQueryString()}` : ''}`}
            {...(condition.isOpenInNewTab ? { target: '_blank' } : {})}
          >
            <Tooltip title='レコード詳細'>
              <IconButton>
                <DocumentIcon className='rad:w-5 rad:h-5' />
              </IconButton>
            </Tooltip>
          </a>
        </div>
      </div>
    </Card>
  );
}

export default function ViewCard(props: Props) {
  return <Container {...props} />;
}

const Container = styled(ViewCardComponent)`
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 2fr;
  height: 100%;

  .🐸right {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 16px;
    padding: 16px;
  }

  .🐸fields {
    display: grid;
    gap: 8px;
  }

  .🐸actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }
`;

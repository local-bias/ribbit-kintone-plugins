import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import type { OutputFieldDef } from '@/schema/plugin-config';
import styled from '@emotion/styled';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Skeleton, TextField, Tooltip } from '@mui/material';
import { useAtom } from 'jotai';
import { Suspense, useCallback } from 'react';

const outputFieldsAtom = getConditionPropertyAtom('outputFields');

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

function OutputFieldsFormComponent() {
  const [outputFields, setOutputFields] = useAtom(outputFieldsAtom);

  const updateField = useCallback(
    (index: number, patch: Partial<OutputFieldDef>) => {
      setOutputFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    },
    [setOutputFields]
  );

  const addField = useCallback(
    (index: number) => {
      const newField: OutputFieldDef = {
        fieldCode: '',
        description: '',
      };
      setOutputFields((prev) => [...prev.slice(0, index + 1), newField, ...prev.slice(index + 1)]);
    },
    [setOutputFields]
  );

  const deleteField = useCallback(
    (index: number) => {
      setOutputFields((prev) => prev.filter((_, i) => i !== index));
    },
    [setOutputFields]
  );

  return (
    <Container>
      {outputFields.map((field, i) => (
        <Row key={i}>
          <JotaiFieldSelect
            fieldCode={field.fieldCode}
            onChange={(code) => updateField(i, { fieldCode: code })}
            fieldPropertiesAtom={currentAppFieldsAtom}
          />
          <TextField
            value={field.description}
            onChange={(e) => updateField(i, { description: e.target.value })}
            label='出力内容の説明'
            variant='outlined'
            sx={{ flex: 1, minWidth: '350px' }}
          />
          <Tooltip title='フィールドを追加する'>
            <IconButton size='small' onClick={() => addField(i)}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {outputFields.length > 1 && (
            <Tooltip title='このフィールドを削除する'>
              <IconButton size='small' onClick={() => deleteField(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Row>
      ))}
    </Container>
  );
}

function OutputFieldsFormPlaceholder() {
  return (
    <Container>
      {[0, 1].map((i) => (
        <Row key={i}>
          <Skeleton variant='rounded' width={200} height={40} />
          <Skeleton variant='rounded' width={350} height={40} />
        </Row>
      ))}
    </Container>
  );
}

export default function OutputFieldsForm() {
  return (
    <Suspense fallback={<OutputFieldsFormPlaceholder />}>
      <OutputFieldsFormComponent />
    </Suspense>
  );
}

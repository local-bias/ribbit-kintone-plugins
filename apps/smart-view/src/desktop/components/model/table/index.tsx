import { useAtomValue } from 'jotai';
import {
  pluginConditionAtom,
  resolvedTableColumnsAtom
} from '../../../states/plugin';
import RecordTableBody from './body';
import RecordTableHead from './head';
import { MyTable } from './layout';

export default function RecordTable() {
  const condition = useAtomValue(pluginConditionAtom);
  const viewFields = useAtomValue(resolvedTableColumnsAtom);

  return (
    <MyTable condition={condition} viewFields={viewFields}>
      <RecordTableHead />
      <RecordTableBody />
    </MyTable>
  );
}

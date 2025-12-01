import {
  handleViewTypeChangeAtom,
  pluginConditionAtom,
  viewTypeAtom,
} from '@/desktop/states/plugin';
import { PluginViewType } from '@/schema/plugin-config';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { Button, ButtonGroup } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { ReactNode } from 'react';

const TYPES = [
  { value: 'table', icon: <TableRowsIcon /> },
  { value: 'card', icon: <ViewModuleIcon /> },
] satisfies { value: PluginViewType; icon: ReactNode; }[];

function ViewTypeSelectComponent() {
  const viewType = useAtomValue(viewTypeAtom);
  const onChange = useSetAtom(handleViewTypeChangeAtom);

  return (
    <ButtonGroup>
      {TYPES.map(({ value, icon }) => (
        <Button key={value} onClick={() => onChange(value)} disabled={viewType === value}>
          {icon}
        </Button>
      ))}
      Button
    </ButtonGroup>
  );
}

export default function ViewTypeSelect() {
  const condition = useAtomValue(pluginConditionAtom);

  if (!condition?.isViewTypeControlEnabled) {
    return null;
  }
  return <ViewTypeSelectComponent />;
}

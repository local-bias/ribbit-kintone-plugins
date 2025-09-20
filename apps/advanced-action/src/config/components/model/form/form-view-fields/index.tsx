import {
  dstAppFormFieldsAtom,
  fieldsAtom,
  handleDstFieldChangeAtom,
  handleFieldTypeChangeAtom,
  handleFixedValueChangeAtom,
  handleSrcFieldChangeAtom,
  srcAppFormFieldsAtom,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewField } from '@/lib/plugin';
import { PluginField, PluginFieldType } from '@/schema/plugin-config';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  JotaiDndContext,
  JotaiSortableContext,
  useArray,
} from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Autocomplete,
  Box,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
} from '@mui/material';
import { cn } from '@repo/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { GripVertical } from 'lucide-react';
import { FC, Suspense } from 'react';

const FIELD_TYPE_OPTIONS = [
  { label: t('config.fields.type.options.copy'), value: 'copy' },
  { label: t('config.fields.type.options.fixed'), value: 'fixed_value' },
  // { label: t('config.fields.type.options.calc'), value: 'calc' },
] as const satisfies { label: string; value: PluginFieldType }[];

const Placeholder: FC = () => {
  return (
    <div className='flex items-center gap-4'>
      <div className='grid place-items-center p-4 outline-none'>
        <GripVertical className='w-5 h-5 text-gray-400' />
      </div>
      <Skeleton variant='rounded' width={350} height={56} />
      <Skeleton variant='rounded' width={120} height={56} />
      <IconButton disabled>
        <SettingsIcon />
      </IconButton>
      <IconButton size='small' disabled>
        <AddIcon fontSize='small' />
      </IconButton>
      <IconButton size='small' disabled>
        <DeleteIcon fontSize='small' />
      </IconButton>
    </div>
  );
};

function DstFieldSelect({ value, index }: { value: PluginField; index: number }) {
  const formFields = useAtomValue(dstAppFormFieldsAtom);
  const onFieldChange = useSetAtom(handleDstFieldChangeAtom);
  return (
    <Autocomplete
      value={formFields.find((field) => field.code === value.dstFieldCode) ?? null}
      sx={{ width: '350px' }}
      options={formFields}
      isOptionEqualToValue={(option, v) => option.code === v.code}
      getOptionLabel={(option) => `${option.label} (${option.code})`}
      onChange={(_, field) => onFieldChange(index, field)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component='li' {...optionProps}>
            <div className='grid'>
              <div className='text-xs text-gray-400'>
                {t('common.autocomplete.options.fieldCode', option.code)}
              </div>
              {option.label}
            </div>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('config.fields.dstFieldCode.label')}
          slotProps={{ inputLabel: { shrink: true } }}
          variant='outlined'
          color='primary'
        />
      )}
    />
  );
}

function DstFieldSelectContainer({ value, index }: { value: PluginField; index: number }) {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
      <DstFieldSelect value={value} index={index} />
    </Suspense>
  );
}

function SrcFieldSelect({ value, index }: { value: PluginField; index: number }) {
  const formFields = useAtomValue(srcAppFormFieldsAtom);
  const onFieldChange = useSetAtom(handleSrcFieldChangeAtom);
  return (
    <Autocomplete
      value={
        formFields.find(
          (field) => field.code === value.srcFieldCode && String(field.appId) === value.srcAppId
        ) ?? null
      }
      sx={{ width: '350px' }}
      options={formFields}
      isOptionEqualToValue={(option, v) =>
        option.code === v.code && String(option.appId) === v.appId
      }
      getOptionLabel={(option) =>
        `${option.appName ? `【${option.appName}】` : ''}${option.label} (${option.code})`
      }
      onChange={(_, field) => onFieldChange(index, field)}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component='li' {...optionProps}>
            <div className='grid'>
              {option.appName && (
                <div className='text-xs text-blue-400'>
                  {t('common.autocomplete.options.appName', option.appName)}
                </div>
              )}
              <div className='text-xs text-gray-400'>
                {t('common.autocomplete.options.fieldCode', option.code)}
              </div>
              {option.label}
            </div>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('config.fields.srcFieldCode.label')}
          slotProps={{ inputLabel: { shrink: true } }}
          variant='outlined'
          color='primary'
        />
      )}
    />
  );
}

function SrcFieldSelectContainer({ value, index }: { value: PluginField; index: number }) {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
      <SrcFieldSelect value={value} index={index} />
    </Suspense>
  );
}

const FieldSelect: FC<{
  value: PluginField;
  index: number;
  addRow: (index: number) => void;
  deleteRow: (index: number) => void;
  deletable: boolean;
}> = ({ value, index, addRow, deleteRow, deletable }) => {
  const {
    isDragging,
    setActivatorNodeRef,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: value.id });

  const onFieldTypeChange = useSetAtom(handleFieldTypeChangeAtom);
  const onFixedValueChange = useSetAtom(handleFixedValueChangeAtom);

  return (
    <div
      ref={setNodeRef}
      className={cn('flex items-center gap-4', {
        'z-50': isDragging,
      })}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        className='grid place-items-center p-4 outline-none'
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        tabIndex={-1}
      >
        <GripVertical className='w-5 h-5 text-gray-400' />
      </div>
      <div className='flex-1'>
        <div className='flex items-center gap-4'>
          <DstFieldSelectContainer value={value} index={index} />
          <TextField
            select
            label={t('config.fields.type.label')}
            value={value.type}
            onChange={(e) => {
              const newType = e.target.value as PluginFieldType;
              onFieldTypeChange(index, newType);
            }}
          >
            {FIELD_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div className='py-4'>
          {value.type === 'copy' && <SrcFieldSelectContainer value={value} index={index} />}
          {value.type === 'fixed_value' && (
            <TextField
              label={t('config.fields.fixedValue.label')}
              value={value.fixedValue}
              onChange={(e) => {
                onFixedValueChange(index, e.target.value);
              }}
            />
          )}
        </div>
      </div>
      <Tooltip title={t('config.fields.tooltip.add')}>
        <IconButton size='small' onClick={() => addRow(index)}>
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('config.fields.tooltip.delete')}>
        <IconButton
          size='small'
          onClick={() => deleteRow(index)}
          disabled={!deletable}
          className={cn({
            invisible: !deletable,
          })}
        >
          <DeleteIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </div>
  );
};

const Component: FC = () => {
  const { addItem, deleteItem } = useArray(fieldsAtom);
  const selectedFields = useAtomValue(fieldsAtom);

  return (
    <>
      {selectedFields.map((value, i) => (
        <Suspense key={value.id} fallback={<Placeholder />}>
          <FieldSelect
            value={value}
            index={i}
            addRow={() => addItem({ index: i + 1, newItem: getNewField() })}
            deleteRow={deleteItem}
            deletable={selectedFields.length > 1}
          />
        </Suspense>
      ))}
    </>
  );
};

const Container: FC = () => {
  return (
    <div className='space-y-4 divide-y'>
      <Suspense fallback={new Array(3).fill('').map((_, i) => <Placeholder key={i} />)}>
        <Component />
      </Suspense>
    </div>
  );
};

function FieldsForm() {
  return (
    // @ts-ignore - webpackでのみ型情報が消える問題の暫定対応
    <JotaiDndContext atom={fieldsAtom}>
      <JotaiSortableContext atom={fieldsAtom}>
        <Container />
      </JotaiSortableContext>
    </JotaiDndContext>
  );
}

export default FieldsForm;

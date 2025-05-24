import { basisFieldsState } from '@/config/states/kintone';
import { adjustmentsAtom } from '@/config/states/plugin';
import {
  ADJUSTMENT_BASIS_TYPES,
  ADJUSTMENT_TARGETS,
  ADJUSTMENT_TYPES,
  getNewAdjustment,
} from '@/lib/plugin';
import { Adjustment } from '@/schema/plugin-config';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useAtom } from 'jotai';
import { FC, Fragment, Suspense } from 'react';

const AdjustmentForm: FC = () => {
  const [adjustments, setAdjustments] = useAtom(adjustmentsAtom);

  const addRow = (i: number) => {
    setAdjustments((prev) => prev.toSpliced(i + 1, 0, getNewAdjustment()));
  };
  const deleteRow = (i: number) => {
    setAdjustments((prev) => prev.filter((_, index) => index !== i));
  };
  const onTypeChange = (i: number, type: Adjustment['type']) => {
    setAdjustments((prev) => prev.toSpliced(i, 1, { ...prev[i]!, type }));
  };
  const onTargetChange = (i: number, target: Adjustment['target']) => {
    setAdjustments((prev) => prev.toSpliced(i, 1, { ...prev[i]!, target }));
  };
  const onBasisTypeChange = (i: number, basisType: Adjustment['basisType']) => {
    setAdjustments((prev) => prev.toSpliced(i, 1, { ...prev[i]!, basisType }));
  };
  const onStaticValueChange = (i: number, staticValue: number) => {
    setAdjustments((prev) => prev.toSpliced(i, 1, { ...prev[i]!, staticValue }));
  };
  const onBasisFieldCodeChange = (i: number, basisFieldCode: string) => {
    setAdjustments((prev) => prev.toSpliced(i, 1, { ...prev[i]!, basisFieldCode }));
  };

  return (
    <div className='grid grid-cols-[auto_1fr_auto_auto] items-center gap-4'>
      {adjustments.map((value, i) => (
        <Fragment key={i}>
          <div>{i + 1}.</div>
          <Accordion key={i}>
            <AccordionSummary>
              <Typography>
                <AdjustmentSummary adjustment={value} />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div className='flex gap-4 mb-4'>
                <TextField
                  label='操作モード'
                  value={value.type}
                  select
                  sx={{ width: 200 }}
                  onChange={(e) => onTypeChange(i, e.target.value as Adjustment['type'])}
                >
                  {ADJUSTMENT_TYPES.map(({ label, value }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label='操作する単位'
                  value={value.target}
                  select
                  sx={{ width: 200 }}
                  onChange={(e) => onTargetChange(i, e.target.value as Adjustment['target'])}
                >
                  {ADJUSTMENT_TARGETS.map(({ label, value }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </div>
              {(value.type === 'add' || value.type === 'subtract') && (
                <div className='flex gap-4'>
                  <TextField
                    label='基準値の種類'
                    value={value.basisType}
                    select
                    sx={{ width: 200 }}
                    onChange={(e) =>
                      onBasisTypeChange(i, e.target.value as Adjustment['basisType'])
                    }
                  >
                    {ADJUSTMENT_BASIS_TYPES.map(({ label, value }) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {value.basisType === 'static' && (
                    <TextField
                      label='基準値'
                      type='number'
                      value={value.staticValue}
                      sx={{ width: 400 }}
                      onChange={(e) => onStaticValueChange(i, Number(e.target.value))}
                    />
                  )}
                  {value.basisType === 'field' && (
                    <JotaiFieldSelect
                      label='基準フィールド'
                      fieldPropertiesAtom={basisFieldsState}
                      fieldCode={value.basisFieldCode}
                      sx={{ width: 400 }}
                      onChange={(e) => onBasisFieldCodeChange(i, e)}
                    />
                  )}
                </div>
              )}
            </AccordionDetails>
          </Accordion>
          <Tooltip title='設定を追加'>
            <IconButton size='small' onClick={() => addRow(i)}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {adjustments.length > 1 && (
            <Tooltip title='この設定を削除'>
              <IconButton size='small' onClick={() => deleteRow(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </Fragment>
      ))}
    </div>
  );
};

const AdjustmentSummary: FC<{ adjustment: Adjustment }> = ({ adjustment }) => {
  const { target, basisType, basisFieldCode, staticValue, type } = adjustment;
  const targetLabel =
    ADJUSTMENT_TARGETS.find((target) => target.value === adjustment.target)?.label ?? '';
  const typeLabel = type === 'add' ? '加算' : '減算';

  if (type === 'start') {
    if (target === 'year') {
      return <>{`1月に設定`}</>;
    }
    if (target === 'month') {
      return <>{`1日に設定`}</>;
    }
    if (target === 'day') {
      return <>{`0時に設定`}</>;
    }
    if (target === 'hour') {
      return <>{`0分に設定`}</>;
    }
    return <>{`0秒に設定`}</>;
  } else if (type === 'end') {
    if (target === 'year') {
      return <>{`12月に設定`}</>;
    }
    if (target === 'month') {
      return <>{`末日に設定`}</>;
    }
    if (target === 'day') {
      return <>{`23時に設定`}</>;
    }
    if (target === 'hour') {
      return <>{`59分に設定`}</>;
    }
    return <>{`59秒に設定`}</>;
  }

  if (basisType === 'static') {
    if (staticValue === 0) {
      return <>{`変更なし`}</>;
    }
    return <>{`${targetLabel}を${staticValue}${typeLabel}`}</>;
  }
  return `フィールド「${basisFieldCode}」の値だけ${targetLabel}を${typeLabel}`;
};

const Placeholder: FC = () => (
  <div className='flex flex-col gap-4'>
    {new Array(3).fill('').map((_, i) => (
      <div key={i} className='flex items-center gap-2'>
        <Skeleton variant='rounded' width={400} height={56} />
        <Skeleton variant='circular' width={24} height={24} />
        <Skeleton variant='circular' width={24} height={24} />
      </div>
    ))}
  </div>
);

export default function AdjustmentsForm() {
  return (
    <Suspense fallback={<Placeholder />}>
      <AdjustmentForm />
    </Suspense>
  );
}

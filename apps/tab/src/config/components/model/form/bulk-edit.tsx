import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Checkbox,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useAtom, useAtomValue } from '@repo/jotai';
import { Suspense, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { bulkEditRowsAtom } from '@/config/states/kintone';
import { newElementPolicyAtom, pluginConditionsAtom } from '@/config/states/plugin';
import {
  applyAssignments,
  type BulkEditAssignments,
  type BulkEditElementRow,
  type BulkEditElementType,
  type BulkEditMarkerRow,
  countAnonymousElements,
  countUnassignedElements,
  getUniqueElementRows,
  readAssignments,
  toggleAllAssignments,
  toggleAssignment,
} from '@/lib/bulk-edit';
import { t } from '@/lib/i18n';
import type { NewElementPolicy } from '@/schema/plugin-config';

const TYPE_LABEL_KEYS = {
  field: 'config.common.bulkEdit.type.field',
  group: 'config.common.bulkEdit.type.group',
  space: 'config.common.bulkEdit.type.space',
  label: 'config.common.bulkEdit.type.label',
  hr: 'config.common.bulkEdit.type.hr',
} as const satisfies Record<BulkEditElementType, Parameters<typeof t>[0]>;

/** 要素IDが未設定で、割り当ての対象にできない行のメッセージ */
const MARKER_MESSAGE_KEYS = {
  anonymousSpace: 'config.common.bulkEdit.anonymousSpace',
  anonymousLabel: 'config.common.bulkEdit.anonymousLabel',
  anonymousHr: 'config.common.bulkEdit.anonymousHr',
} as const satisfies Record<BulkEditMarkerRow['kind'], Parameters<typeof t>[0]>;

/** 1列目(要素名)を横スクロールしても隠れないよう固定するためのスタイル */
const STICKY_COLUMN = {
  position: 'sticky',
  left: 0,
  bgcolor: 'background.paper',
  zIndex: 1,
} as const;

/** タブ名が未設定の場合に、サイドバーと同じ表記へ倒します */
const getTabLabel = (tabName: string): string =>
  tabName || t('common.config.sidebar.tab.defaultLabel');

function ElementName({ row, unassigned }: { row: BulkEditElementRow; unassigned: boolean }) {
  return (
    <div className='flex items-center gap-2' style={{ paddingLeft: row.nested ? 24 : 0 }}>
      <Chip label={t(TYPE_LABEL_KEYS[row.type])} size='small' variant='outlined' />
      <span className='break-all'>{row.name}</span>
      {unassigned && (
        <Tooltip title={t('config.common.bulkEdit.unassignedElement')}>
          <WarningAmberRoundedIcon color='warning' fontSize='small' />
        </Tooltip>
      )}
      {row.duplicated && (
        <Tooltip title={t('config.common.bulkEdit.duplicated')}>
          <ContentCopyRoundedIcon color='warning' fontSize='small' />
        </Tooltip>
      )}
    </div>
  );
}

/** 要素IDが未設定で、割り当ての対象にできない行を描画します */
function MarkerRow({ row, columnCount }: { row: BulkEditMarkerRow; columnCount: number }) {
  return (
    <TableRow>
      <TableCell colSpan={columnCount} sx={{ py: 0.5 }}>
        <div
          className='flex items-center gap-2 text-xs text-amber-700'
          style={{ paddingLeft: row.nested ? 24 : 0 }}
        >
          <WarningAmberRoundedIcon color='warning' sx={{ fontSize: 16 }} />
          {t(MARKER_MESSAGE_KEYS[row.kind])}
        </div>
      </TableCell>
    </TableRow>
  );
}

function BulkEditTable() {
  const rows = useAtomValue(bulkEditRowsAtom);
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [newElementPolicy, setNewElementPolicy] = useAtom(newElementPolicyAtom);

  const assignments = useMemo(() => readAssignments({ rows, conditions }), [rows, conditions]);
  const elementRows = useMemo(() => getUniqueElementRows(rows), [rows]);
  const unassignedCount = countUnassignedElements({ rows, assignments });
  const anonymousCount = countAnonymousElements(rows);

  /**
   * 割り当てを変更し、タブ設定へ書き戻します
   *
   * 変更前の割り当ては常に最新のタブ設定から読み直すため、
   * 描画に使用している値が古くなっていても、結果がずれることはありません
   */
  const updateAssignments = useCallback(
    (
      mutate: (assignments: BulkEditAssignments) => BulkEditAssignments,
      policy: NewElementPolicy
    ) => {
      setConditions((prev) =>
        applyAssignments({
          conditions: prev,
          rows,
          assignments: mutate(readAssignments({ rows, conditions: prev })),
          newElementPolicy: policy,
        })
      );
    },
    [rows, setConditions]
  );

  const onToggle = (params: { assignmentKey: string; conditionId: string; assigned: boolean }) => {
    updateAssignments(
      (current) => toggleAssignment({ assignments: current, ...params }),
      newElementPolicy
    );
  };

  const onToggleColumn = (params: { conditionId: string; assigned: boolean }) => {
    updateAssignments(
      (current) => toggleAllAssignments({ assignments: current, rows, ...params }),
      newElementPolicy
    );
  };

  // 保存済みの設定を新しい扱いへ揃えるため、表示結果を保ったまま書き出し方だけを変更する
  const onPolicyChange = (policy: NewElementPolicy) => {
    updateAssignments((current) => current, policy);
    setNewElementPolicy(policy);
  };

  if (conditions.length === 0) {
    return <Alert severity='info'>{t('config.common.bulkEdit.noTabs')}</Alert>;
  }

  if (elementRows.length === 0) {
    return <Alert severity='info'>{t('config.common.bulkEdit.noElements')}</Alert>;
  }

  return (
    <div className='grid gap-4'>
      {unassignedCount > 0 && (
        <Alert severity='warning'>
          {t('config.common.bulkEdit.unassigned', String(unassignedCount))}
        </Alert>
      )}
      {anonymousCount > 0 && (
        <Alert severity='warning'>
          {t('config.common.bulkEdit.anonymous', String(anonymousCount))}
        </Alert>
      )}
      <div className='max-h-[70vh] overflow-auto border border-gray-200 rounded'>
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...STICKY_COLUMN, zIndex: 3, minWidth: 240 }}>
                {t('config.common.bulkEdit.element')}
              </TableCell>
              {conditions.map((condition, index) => {
                const assignedCount = elementRows.filter((row) =>
                  (assignments[row.assignmentKey] ?? []).includes(condition.id)
                ).length;
                return (
                  <TableCell key={condition.id} align='center' sx={{ minWidth: 120 }}>
                    <div className='grid justify-items-center'>
                      <div className='text-[11px] leading-4 text-gray-400'>
                        {`${t('common.config.sidebar.tab.label')}${index + 1}`}
                      </div>
                      <div className='max-w-32 truncate'>{getTabLabel(condition.tabName)}</div>
                      <Checkbox
                        size='small'
                        checked={assignedCount === elementRows.length}
                        indeterminate={assignedCount > 0 && assignedCount < elementRows.length}
                        onChange={(event) =>
                          onToggleColumn({
                            conditionId: condition.id,
                            assigned: event.target.checked,
                          })
                        }
                        inputProps={{
                          'aria-label': t(
                            'config.common.bulkEdit.toggleColumn',
                            getTabLabel(condition.tabName)
                          ),
                        }}
                      />
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              if (row.kind !== 'element') {
                return <MarkerRow key={row.id} row={row} columnCount={conditions.length + 1} />;
              }
              const assignedTabIds = assignments[row.assignmentKey] ?? [];
              return (
                <TableRow key={row.id} hover>
                  <TableCell sx={STICKY_COLUMN}>
                    <ElementName row={row} unassigned={assignedTabIds.length === 0} />
                  </TableCell>
                  {conditions.map((condition) => (
                    <TableCell key={condition.id} align='center' sx={{ py: 0 }}>
                      <Checkbox
                        size='small'
                        checked={assignedTabIds.includes(condition.id)}
                        onChange={(event) =>
                          onToggle({
                            assignmentKey: row.assignmentKey,
                            conditionId: condition.id,
                            assigned: event.target.checked,
                          })
                        }
                        inputProps={{
                          'aria-label': `${row.name} / ${getTabLabel(condition.tabName)}`,
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div>
        <div className='text-sm font-bold'>{t('config.common.bulkEdit.newElement.label')}</div>
        <div className='text-xs text-gray-500'>
          {t('config.common.bulkEdit.newElement.description')}
        </div>
        <RadioGroup
          row
          value={newElementPolicy}
          onChange={(event) => onPolicyChange(event.target.value as NewElementPolicy)}
        >
          <FormControlLabel
            value='show'
            control={<Radio size='small' />}
            label={t('config.common.bulkEdit.newElement.show')}
          />
          <FormControlLabel
            value='hide'
            control={<Radio size='small' />}
            label={t('config.common.bulkEdit.newElement.hide')}
          />
        </RadioGroup>
      </div>
    </div>
  );
}

function BulkEditError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return <Alert severity='error'>{t('config.error.formLoadFailure', message)}</Alert>;
}

/**
 * アプリのフォームレイアウトを一覧し、要素ごとに表示するタブを割り当てます
 *
 * タブごとの詳細設定と同じ設定情報を、要素を起点として編集するための画面です
 */
export function BulkEdit() {
  return (
    <ErrorBoundary FallbackComponent={({ error }) => <BulkEditError error={error} />}>
      <Suspense fallback={<Skeleton variant='rounded' height={320} />}>
        <BulkEditTable />
      </Suspense>
    </ErrorBoundary>
  );
}

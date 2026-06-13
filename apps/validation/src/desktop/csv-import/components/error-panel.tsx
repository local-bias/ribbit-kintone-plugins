import {
  Alert,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import type { FC } from 'react';
import type { RecordValidationError } from '../build-records';
import { DrawerLayout } from './drawer-layout';
import { SummaryBar, type SummaryItem } from './summary-bar';

interface ErrorPanelProps {
  errors: RecordValidationError[];
  /** 取り込もうとした総件数（データ行数） */
  totalCount: number;
  /** エラーとなった行数（重複行は1件として数える） */
  errorRowCount: number;
  /** エラー行を除いて取り込みを続行できるか（skipモード時のみ true） */
  canProceed: boolean;
  onBack: () => void;
  onProceed: () => void;
}

export const ErrorPanel: FC<ErrorPanelProps> = ({
  errors,
  totalCount,
  errorRowCount,
  canProceed,
  onBack,
  onProceed,
}) => {
  const validCount = Math.max(totalCount - errorRowCount, 0);
  const items: SummaryItem[] = [
    { label: '取り込み対象', value: totalCount, tone: 'neutral' },
    { label: '正常', value: validCount, tone: validCount > 0 ? 'success' : 'neutral' },
    { label: 'エラー', value: errorRowCount, tone: errorRowCount > 0 ? 'error' : 'neutral' },
  ];

  const footer = (
    <>
      <Button sx={{ mr: 'auto' }} onClick={onBack}>
        設定に戻る
      </Button>
      {canProceed && (
        <Button variant='contained' onClick={onProceed} disabled={validCount === 0}>
          エラー行を除いて取り込む
        </Button>
      )}
    </>
  );

  return (
    <DrawerLayout title='入力チェック結果' footer={footer}>
      <SummaryBar items={items} />

      <Alert severity={canProceed ? 'warning' : 'error'} sx={{ my: 2 }}>
        {canProceed
          ? `エラーのない ${validCount.toLocaleString()} 件のみを取り込みます。エラー行は取り込まれません。`
          : '以下のエラーを解消してから、再度インポートしてください。「エラー発生時の挙動」で「エラー行を除いて取り込む」を選ぶと、正常な行のみ取り込めます。'}
      </Alert>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}>
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80, bgcolor: 'grey.50' }}>行</TableCell>
              <TableCell sx={{ bgcolor: 'grey.50' }}>フィールド</TableCell>
              <TableCell sx={{ bgcolor: 'grey.50' }}>エラー内容</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={`${error.rowNumber}-${error.fieldCode}-${error.errorMessage}`}>
                <TableCell>{error.rowNumber}</TableCell>
                <TableCell>{error.fieldCode}</TableCell>
                <TableCell>{error.errorMessage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </DrawerLayout>
  );
};

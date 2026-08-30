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
import { t } from '@/lib/i18n';
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
    { label: t('csv.summary.total'), value: totalCount, tone: 'neutral' },
    {
      label: t('csv.summary.valid'),
      value: validCount,
      tone: validCount > 0 ? 'success' : 'neutral',
    },
    {
      label: t('csv.summary.error'),
      value: errorRowCount,
      tone: errorRowCount > 0 ? 'error' : 'neutral',
    },
  ];

  const footer = (
    <>
      <Button sx={{ mr: 'auto' }} onClick={onBack}>
        {t('csv.common.back')}
      </Button>
      {canProceed && (
        <Button variant='contained' onClick={onProceed} disabled={validCount === 0}>
          {t('csv.validation.proceed')}
        </Button>
      )}
    </>
  );

  return (
    <DrawerLayout title={t('csv.validation.title')} footer={footer}>
      <SummaryBar items={items} />

      <Alert severity={canProceed ? 'warning' : 'error'} sx={{ my: 2 }}>
        {canProceed
          ? t('csv.validation.alert.canProceed', validCount.toLocaleString())
          : t('csv.validation.alert.blocked')}
      </Alert>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}>
        <Table size='small' stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80, bgcolor: 'grey.50' }}>
                {t('csv.validation.table.row')}
              </TableCell>
              <TableCell sx={{ bgcolor: 'grey.50' }}>{t('csv.validation.table.field')}</TableCell>
              <TableCell sx={{ bgcolor: 'grey.50' }}>{t('csv.validation.table.message')}</TableCell>
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

import {
  Box,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { FC } from 'react';
import type { ColumnMapping, ImportableField } from '../types';

interface MappingPreviewTableProps {
  headers: string[];
  previewRows: string[][];
  mapping: ColumnMapping;
  importableFields: ImportableField[];
  onMappingChange: (columnIndex: number, fieldCode: string) => void;
}

const IGNORE_VALUE = '';

export const MappingPreviewTable: FC<MappingPreviewTableProps> = ({
  headers,
  previewRows,
  mapping,
  importableFields,
  onMappingChange,
}) => {
  /** 他の列で既に割り当て済みのフィールドかどうか（重複割り当て防止） */
  const isUsedElsewhere = (fieldCode: string, columnIndex: number): boolean =>
    mapping.some((code, index) => index !== columnIndex && code === fieldCode);

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'auto', maxHeight: '50vh' }}>
      <Table size='small' stickyHeader>
        <TableHead>
          <TableRow>
            {headers.map((header, columnIndex) => (
              // CSVの列順は固定のため index をキーに使用
              // biome-ignore lint/suspicious/noArrayIndexKey: CSV列はインデックスで一意
              <TableCell key={columnIndex} sx={{ minWidth: 200, verticalAlign: 'top', bgcolor: 'grey.50' }}>
                <Typography variant='caption' color='text.secondary' noWrap component='div' title={header}>
                  {header || `列 ${columnIndex + 1}`}
                </Typography>
                <Select
                  size='small'
                  fullWidth
                  displayEmpty
                  value={mapping[columnIndex] ?? IGNORE_VALUE}
                  onChange={(event) => onMappingChange(columnIndex, event.target.value)}
                  sx={{ mt: 0.5, bgcolor: 'background.paper' }}
                >
                  <MenuItem value={IGNORE_VALUE}>
                    <Typography color='text.secondary' variant='body2'>
                      （取り込まない）
                    </Typography>
                  </MenuItem>
                  {importableFields.map((field) => (
                    <MenuItem
                      key={field.code}
                      value={field.code}
                      disabled={isUsedElsewhere(field.code, columnIndex)}
                    >
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {previewRows.map((row, rowIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: プレビュー行は固定順
            <TableRow key={rowIndex}>
              {headers.map((_, columnIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: CSV列はインデックスで一意
                <TableCell key={columnIndex}>
                  <Typography variant='body2' noWrap sx={{ maxWidth: 240 }} title={row[columnIndex] ?? ''}>
                    {row[columnIndex] ?? ''}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          ))}
          {previewRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={Math.max(headers.length, 1)}>
                <Typography variant='body2' color='text.secondary'>
                  プレビューできるデータ行がありません。
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

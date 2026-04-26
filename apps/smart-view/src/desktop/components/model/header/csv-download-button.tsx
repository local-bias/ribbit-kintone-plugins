import styled from '@emotion/styled';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Button, Tooltip } from '@mui/material';
import { t } from '@/lib/i18n';

function CsvDownloadButtonComponent({ className }: { className?: string }) {
  return (
    <Tooltip title={t('desktop.app.tooltip.csvExport')}>
      <Button
        {...{ className }}
        variant='contained'
        color='inherit'
        disabled
        endIcon={<GetAppIcon />}
      >
        CSV
      </Button>
    </Tooltip>
  );
}

const StyledCsvDownloadButtonComponent = styled(CsvDownloadButtonComponent)`
  color: #1976d2;
  background-color: #f1f1f7;
  &:hover,
  &:active {
    background-color: #e1e1ea;
  }
`;

export default function CsvDownloadButton() {
  return <StyledCsvDownloadButtonComponent />;
}

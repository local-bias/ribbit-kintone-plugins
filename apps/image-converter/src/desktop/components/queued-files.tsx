import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { useAtomValue } from 'jotai';
import { currentAppFileFieldsAtom, queuedFilesAtom } from '../states';

export default function QueuedFiles() {
  const properties = useAtomValue(currentAppFileFieldsAtom);
  const files = useAtomValue(queuedFilesAtom);

  if (!Object.keys(files).length) {
    return null;
  }

  return (
    <div className='rad:fixed rad:bottom-4 rad:right-4 rad:z-50 rad:w-96'>
      {Object.entries(files).map(([fieldCode, fileList]) => {
        const label = properties.find((p) => p.code === fieldCode)?.label ?? fieldCode;
        return (
          <Accordion key={fieldCode} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>{label}</AccordionSummary>
            <AccordionDetails>
              <div className='rad:pl-6 rad:grid rad:gap-2'>
                {fileList.map((file) => (
                  <div key={file.fileKey} className='list-item'>
                    {file.name}
                    <span> ({Math.round(Number(file.size) / 102) / 10} KB)</span>
                  </div>
                ))}
              </div>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}

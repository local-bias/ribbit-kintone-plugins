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
    <div className='fixed bottom-4 right-4 z-50 w-96'>
      {Object.entries(files).map(([fieldCode, fileList]) => {
        const label = properties.find((p) => p.code === fieldCode)?.label ?? fieldCode;
        return (
          <Accordion key={fieldCode} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>{label}</AccordionSummary>
            <AccordionDetails>
              <div className='pl-6 grid gap-2'>
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

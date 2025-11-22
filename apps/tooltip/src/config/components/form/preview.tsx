import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { selectedConditionAtom } from '@/config/states/plugin';
import { TooltipIcon } from '@/lib/components/tooltip-icon';
import DOMPurify from 'dompurify';
import { useAtomValue } from 'jotai';


function PreviewEmoji() {
  const condition = useAtomValue(selectedConditionAtom);
  if (condition.type !== 'emoji') {
    return null;
  }
  return <span className='text-lg cursor-default'>{condition.emoji}</span>;
}

function PreviewIcon() {
  const condition = useAtomValue(selectedConditionAtom);
  if (condition.type !== 'icon') {
    return null;
  }
  return <TooltipIcon iconType={condition.iconType} iconColor={condition.iconColor} />;
}

export default function Preview() {
  const condition = useAtomValue(selectedConditionAtom);

  return (
    <div className='w-24 h-24 grid place-items-center border rounded-sm'>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger className='grid place-items-center'>
            <PreviewIcon />
            <PreviewEmoji />
          </TooltipTrigger>
          <TooltipContent
            style={{
              backgroundColor: condition.backgroundColor,
              color: condition.foregroundColor,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(condition.label) }} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

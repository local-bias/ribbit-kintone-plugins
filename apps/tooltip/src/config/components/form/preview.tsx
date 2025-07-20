import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { selectedConditionAtom } from '@/config/states/plugin';
import { TooltipIcon } from '@/lib/components/tooltip-icon';
import DOMPurify from 'dompurify';
import { useAtomValue } from 'jotai';
import React, { type FC } from 'react';

const Emoji: FC = () => {
  const condition = useAtomValue(selectedConditionAtom);
  if (condition.type !== 'emoji') {
    return null;
  }
  return <span className='text-lg cursor-default'>{condition.emoji}</span>;
};

const Icon: FC = () => {
  const condition = useAtomValue(selectedConditionAtom);
  if (condition.type !== 'icon') {
    return null;
  }
  return <TooltipIcon iconType={condition.iconType} iconColor={condition.iconColor} />;
};

const Component: FC = () => {
  const condition = useAtomValue(selectedConditionAtom);

  return (
    <div className='w-24 h-24 grid place-items-center border rounded-sm'>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger className='grid place-items-center'>
            <Icon />
            <Emoji />
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
};

export default Component;

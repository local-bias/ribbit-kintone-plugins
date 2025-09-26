import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PluginCondition } from '@/schema/plugin-config';
import { isMobile } from '@konomi-app/kintone-utilities';
import DOMPurify from 'dompurify';
import { type FC } from 'react';
import TooltipEmojiContainer from './emoji';
import TooltipIconContainer from './icon';

type Props = {
  condition: PluginCondition;
};

const commonCss =
  'rad:absolute rad:left-0 rad:p-0 rad:top-1/2 rad:-translate-y-1/2 rad:grid rad:place-items-center';

const MobileTooltipContainer: FC<Props> = ({ condition }) => {
  return (
    <span className='rad:relative'>
      <Popover>
        <PopoverTrigger className={commonCss}>
          <TooltipIconContainer condition={condition} />
          <TooltipEmojiContainer condition={condition} />
        </PopoverTrigger>
        <PopoverContent
          style={{
            backgroundColor: condition.backgroundColor,
            color: condition.foregroundColor,
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(condition.label) }} />
        </PopoverContent>
      </Popover>
    </span>
  );
};

const DesktopTooltipContainer: FC<Props> = ({ condition }) => {
  return (
    <TooltipProvider>
      <span className='rad:relative'>
        <Tooltip delayDuration={0}>
          <TooltipTrigger className={commonCss}>
            <TooltipIconContainer condition={condition} />
            <TooltipEmojiContainer condition={condition} />
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
      </span>
    </TooltipProvider>
  );
};

const TooltipContainer: FC<Props> = (props) => {
  return isMobile() ? (
    <MobileTooltipContainer {...props} />
  ) : (
    <DesktopTooltipContainer {...props} />
  );
};

export default TooltipContainer;

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui';
import { PluginCondition } from '@/schema/plugin-config';
import { isMobile } from '@konomi-app/kintone-utilities';
import DOMPurify from 'dompurify';
import { type FC } from 'react';
import TooltipEmojiContainer from './emoji';
import TooltipIconContainer from './icon';
import { css } from '@emotion/css';

type Props = {
  condition: PluginCondition;
};

const commonCss =
  'rad:absolute rad:left-0 rad:p-0 rad:top-1/2 rad:-translate-y-1/2 rad:grid rad:place-items-center rad:border-0 rad:bg-transparent rad:shadow-none rad:cursor-pointer';

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
            className={css`
              background-color: ${condition.backgroundColor};
              color: ${condition.foregroundColor};

              svg {
                fill: ${condition.backgroundColor};
                background-color: ${condition.backgroundColor};
              }
            `}
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

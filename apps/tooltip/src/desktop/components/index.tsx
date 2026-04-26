import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { isMobile } from '@konomi-app/kintone-utilities';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui';
import type { FC } from 'react';
import { TooltipHtmlContent } from '@/lib/components/tooltip-html-content';
import type { PluginCondition } from '@/schema/plugin-config';
import TooltipEmojiContainer from './emoji';
import TooltipIconContainer from './icon';

type Props = {
  condition: PluginCondition;
};

const TriggerContainer = styled.span`
  position: relative;
  margin-left: 4px;
`;

const triggerStyles = `
  position: absolute;
  left: 0;
  top: 50%;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  transform: translateY(-50%);
`;

const StyledPopoverTrigger = styled(PopoverTrigger)`
  ${triggerStyles}
`;

const StyledTooltipTrigger = styled(TooltipTrigger)`
  ${triggerStyles}
`;

const MobileTooltipContainer: FC<Props> = ({ condition }) => {
  return (
    <TriggerContainer>
      <Popover>
        <StyledPopoverTrigger>
          <TooltipIconContainer condition={condition} />
          <TooltipEmojiContainer condition={condition} />
        </StyledPopoverTrigger>
        <PopoverContent
          style={{
            backgroundColor: condition.backgroundColor,
            color: condition.foregroundColor,
          }}
        >
          <TooltipHtmlContent html={condition.label} />
        </PopoverContent>
      </Popover>
    </TriggerContainer>
  );
};

const DesktopTooltipContainer: FC<Props> = ({ condition }) => {
  return (
    <TooltipProvider>
      <TriggerContainer>
        <Tooltip delayDuration={0}>
          <StyledTooltipTrigger>
            <TooltipIconContainer condition={condition} />
            <TooltipEmojiContainer condition={condition} />
          </StyledTooltipTrigger>
          <TooltipContent
            style={{
              backgroundColor: condition.backgroundColor,
              color: condition.foregroundColor,
            }}
            className={css`
              background-color: ${condition.backgroundColor};
              color: ${condition.foregroundColor};

              svg {
                fill: ${condition.backgroundColor};
                background-color: ${condition.backgroundColor};
              }
            `}
          >
            <TooltipHtmlContent html={condition.label} />
          </TooltipContent>
        </Tooltip>
      </TriggerContainer>
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

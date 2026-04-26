import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';
import type * as React from 'react';

const slideDown = keyframes`
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
`;

const slideUp = keyframes`
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
`;

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot='accordion' {...props} />;
}

const StyledAccordionItem = styled(AccordionPrimitive.Item)`
  border-bottom: 1px solid #e0e0e0;
  &:last-child {
    border-bottom: none;
  }
`;

function AccordionItem(props: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <StyledAccordionItem data-slot='accordion-item' {...props} />;
}

const StyledAccordionHeader = styled(AccordionPrimitive.Header)`
  display: flex;
`;

const StyledAccordionTrigger = styled(AccordionPrimitive.Trigger)`
  display: flex;
  flex: 1;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-radius: 4px;
  padding: 16px 0;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  & > svg {
    transition: transform 0.2s ease;
  }

  &[data-state='open'] > svg {
    transform: rotate(180deg);
  }
`;

const ChevronIcon = styled(ChevronDownIcon)`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #757575;
  pointer-events: none;
  transform: translateY(2px);
`;

function AccordionTrigger({
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <StyledAccordionHeader>
      <StyledAccordionTrigger data-slot='accordion-trigger' {...props}>
        {children}
        <ChevronIcon />
      </StyledAccordionTrigger>
    </StyledAccordionHeader>
  );
}

const StyledAccordionContent = styled(AccordionPrimitive.Content)`
  overflow: hidden;
  font-size: 14px;

  &[data-state='open'] {
    animation: ${slideDown} 0.2s ease-out;
  }
  &[data-state='closed'] {
    animation: ${slideUp} 0.2s ease-out;
  }
`;

const AccordionContentInner = styled.div`
  padding: 0 0 16px;
`;

function AccordionContent({
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <StyledAccordionContent data-slot='accordion-content' {...props}>
      <AccordionContentInner>{children}</AccordionContentInner>
    </StyledAccordionContent>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };

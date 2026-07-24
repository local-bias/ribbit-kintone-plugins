'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { css } from '@emotion/css';

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'start', side = 'left', sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    side={side}
    sideOffset={sideOffset}
    className={css`
      z-index: 9999;
      width: 16rem;
      border-radius: 0.375rem;
      border: 1px solid hsl(var(--ribbit-border));
      background-color: hsl(var(--ribbit-popover));
      padding: 1rem;
      color: hsl(var(--ribbit-popover-foreground));
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -2px rgba(0, 0, 0, 0.1);
      outline: none;
      transform-origin: var(--radix-hover-card-content-transform-origin);

      &[data-state='open'] {
        animation: fadeIn 0.2s ease-out forwards;
      }

      &[data-state='closed'] {
        animation: fadeOut 0.2s ease-out forwards;
      }

      &[data-state='closed'] {
        animation-name: fadeOut;
      }

      &[data-state='open'] {
        animation-name: fadeIn;
      }

      &[data-state='closed'] {
        animation-name: zoomOut;
      }

      &[data-state='open'] {
        animation-name: zoomIn;
      }

      &[data-side='bottom'] {
        animation-name: slideFromTop;
      }

      &[data-side='left'] {
        animation-name: slideFromRight;
      }

      &[data-side='right'] {
        animation-name: slideFromLeft;
      }

      &[data-side='top'] {
        animation-name: slideFromBottom;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }

      @keyframes zoomIn {
        from {
          transform: scale(0.95);
        }
        to {
          transform: scale(1);
        }
      }

      @keyframes zoomOut {
        from {
          transform: scale(1);
        }
        to {
          transform: scale(0.95);
        }
      }

      @keyframes slideFromTop {
        from {
          transform: translateY(-0.5rem);
        }
        to {
          transform: translateY(0);
        }
      }

      @keyframes slideFromRight {
        from {
          transform: translateX(0.5rem);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes slideFromLeft {
        from {
          transform: translateX(-0.5rem);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes slideFromBottom {
        from {
          transform: translateY(0.5rem);
        }
        to {
          transform: translateY(0);
        }
      }

      ${className}
    `}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };

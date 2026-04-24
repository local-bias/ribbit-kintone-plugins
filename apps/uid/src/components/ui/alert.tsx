import * as React from 'react';
import { css, cx } from '@emotion/css';

const alertBaseStyles = css`
  position: relative;
  width: 100%;
  border-radius: var(--ribbit-radius);
  border: 1px solid hsl(var(--ribbit-border));
  padding: 16px;

  & > svg ~ * {
    padding-left: 28px;
  }
  & > svg + div {
    transform: translateY(-3px);
  }
  & > svg {
    position: absolute;
    left: 16px;
    top: 16px;
    color: hsl(var(--ribbit-foreground));
  }
`;

const alertVariantStyles: Record<string, string> = {
  default: css`
    background-color: hsl(var(--ribbit-background));
    color: hsl(var(--ribbit-foreground));
  `,
  destructive: css`
    border-color: hsl(var(--ribbit-destructive) / 0.5);
    color: hsl(var(--ribbit-destructive));
    & > svg {
      color: hsl(var(--ribbit-destructive));
    }
  `,
};

const alertTitleStyles = css`
  margin: 0 0 4px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025em;
`;

const alertDescriptionStyles = css`
  font-size: 14px;
  line-height: 20px;

  & p {
    line-height: 1.625;
  }
`;

type AlertVariant = 'default' | 'destructive';

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    role='alert'
    className={cx(alertBaseStyles, alertVariantStyles[variant], className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cx(alertTitleStyles, className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx(alertDescriptionStyles, className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };

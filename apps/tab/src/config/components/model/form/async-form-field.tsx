import { Skeleton, TextField } from '@mui/material';
import { type ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { t } from '@/lib/i18n';

const DEFAULT_WIDTH = 480;

function FormFieldError({ label, error, width }: { label: string; error: unknown; width: number }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <TextField
      error
      label={label}
      helperText={t('config.error.formLoadFailure', message)}
      sx={{ width, maxWidth: '100%' }}
    />
  );
}

/**
 * アプリのフォーム情報を非同期に取得するフォーム部品を、
 * ローディング表示とエラー表示で包みます
 */
export function AsyncFormField(props: { label: string; width?: number; children: ReactNode }) {
  const { label, width = DEFAULT_WIDTH, children } = props;

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <FormFieldError label={label} error={error} width={width} />
      )}
    >
      <Suspense fallback={<Skeleton variant='rounded' width={width} height={56} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

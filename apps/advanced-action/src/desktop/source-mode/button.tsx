import { PluginCondition } from '@/schema/plugin-config';
import { css } from '@emotion/css';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { cn } from '@repo/utils';
import { useAtomValue } from 'jotai';
import { ComponentProps, Suspense } from 'react';
import { destinationUrlAtom } from './state';
import { Loader } from '@konomi-app/ui-react';

type Props = {
  condition: PluginCondition;
  record: kintoneAPI.RecordData;
};

function KintoneButton(props: ComponentProps<'button'>) {
  const { className, ...rest } = props;
  return (
    <button
      type='button'
      className={cn(
        'ribbit:relative ribbit:!text-sm ribbit:inline ribbit:box-border ribbit:[border:1px_solid_#e3e7e8] ribbit:h-12 ribbit:grid ribbit:place-items-center ribbit:transition-all ribbit:min-w-40 ribbit:px-4',
        className
      )}
      {...rest}
    />
  );
}

function ActionButtonComponent({ condition, record }: Props) {
  const url = useAtomValue(
    destinationUrlAtom({
      conditionId: condition.id,
      recordId: record?.$id?.value as string,
      revision: record?.$revision?.value as string,
    })
  );

  return (
    <a href={url}>
      <KintoneButton
        className={cn(
          css`
            background-color: #f7f9fa;
            line-height: 48px;
            padding: 0 16px;
            color: #3498db;
            &:hover {
              background-color: #edf2f7;
            }
          `
        )}
      >
        {condition.buttonLabel}
      </KintoneButton>
    </a>
  );
}

export default function ActionButton(props: Props) {
  return (
    <Suspense
      fallback={
        <KintoneButton>
          <span className='ribbit:opacity-30'>{props.condition.buttonLabel}</span>
          <Loader className='ribbit:!text-lg ribbit:bg-muted ribbit:cursor-not-allowed ribbit:!absolute ribbit:left-1/2 ribbit:top-1/2 ribbit:-translate-x-1/2 ribbit:-translate-y-1/2' />
        </KintoneButton>
      }
    >
      <ActionButtonComponent {...props} />
    </Suspense>
  );
}

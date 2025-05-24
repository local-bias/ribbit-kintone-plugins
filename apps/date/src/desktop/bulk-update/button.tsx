import { PluginCondition } from '@/schema/plugin-config';
import styled from '@emotion/styled';
import { store } from '@repo/jotai';
import { Provider, useAtomValue } from 'jotai';
import { Suspense, type FC } from 'react';
import { currentAppFormFieldsAtom } from './state';
import { useBulkUpdate } from './use-bulk-update';

type Props = {
  condition: PluginCondition;
};

const Label: FC<{ fieldCode: string }> = ({ fieldCode }) => {
  const fieldProperties = useAtomValue(currentAppFormFieldsAtom);

  const property = fieldProperties.find((field) => field.code === fieldCode);

  const fieldName = property?.label ?? fieldCode;

  return (
    <>
      {fieldName}
      を一括更新
    </>
  );
};

const Component = ({ condition, className }: Props & { className?: string }) => {
  const bulkUpdate = useBulkUpdate({ condition });

  return (
    <div className={className} onClick={bulkUpdate}>
      <Suspense
        fallback={
          <>
            {condition.targetFieldCode}
            を一括更新
          </>
        }
      >
        <Label fieldCode={condition.targetFieldCode} />
      </Suspense>
    </div>
  );
};

const StyledComponent = styled(Component)`
  display: inline-flex;
  box-sizing: border-box;
  cursor: pointer;
  line-height: 48px;
  padding: 0 12px;
  font-size: 14px;
  color: color-mix(in oklab, var(--🐸foreground) 70%, transparent);
  border: 1px solid #e3e7e8;
  background-color: #f7f9fa;
  background-position: center center;
  background-repeat: no-repeat;
  vertical-align: middle;
  &:hover {
    color: var(--🐸primary);
  }
`;

export default function App(props: Props) {
  return (
    <Provider store={store}>
      <StyledComponent {...props} />
    </Provider>
  );
}

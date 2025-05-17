import { CONCATENATION_ITEM_TYPES } from '@/lib/plugin';
import { AccordionSummary } from '@mui/material';
import { FC } from 'react';

type Props = { item: Plugin.Condition['concatenationItems'][number] };

const Component: FC<Props> = ({ item }) => {
  const label = CONCATENATION_ITEM_TYPES.find((type) => type.value === item.type)?.label ?? '';

  switch (item.type) {
    case 'string':
      return (
        <div>
          {label} {item.value ? `(${item.value})` : ''}
        </div>
      );
    case 'field':
      return (
        <div>
          {label} {item.value ? `(${item.value})` : ''}
        </div>
      );
    default:
      return <div>{label}</div>;
  }
};

const Container: FC<Props> = (props) => {
  return (
    <AccordionSummary>
      <Component {...props} />
    </AccordionSummary>
  );
};

export default Container;

import { Accordion, AccordionActions, AccordionDetails, AccordionSummary } from '@mui/material';
import { FC, FCX, memo, useState } from 'react';

import ConditionDeletionButton from '../condition-deletion-button';
import ConditionForm from './condition-form';

type ContainerProps = Readonly<{ condition: kintone.plugin.Condition; index: number }>;
type Props = ContainerProps & {
  expanded: boolean;
  onChange: () => void;
};

const Component: FCX<Props> = ({ className, condition, index, expanded, onChange }) => (
  <Accordion {...{ expanded, onChange, className }} variant='outlined' square>
    <AccordionSummary>設定({condition.targetField})</AccordionSummary>
    <AccordionDetails>
      <ConditionForm {...{ condition, index }} />
    </AccordionDetails>
    <AccordionActions>
      <ConditionDeletionButton {...{ index }} />
    </AccordionActions>
  </Accordion>
);

const Container: FC<ContainerProps> = memo(({ condition, index }) => {
  const [expanded, setExpanded] = useState<boolean>(index === 0);

  const onChange = () => setExpanded((_expanded) => !_expanded);

  return <Component {...{ condition, index, expanded, onChange }} />;
});

export default Container;

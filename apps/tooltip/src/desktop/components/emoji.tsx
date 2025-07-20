import { PluginCondition } from '@/schema/plugin-config';
import { FC } from 'react';

type Props = { condition: PluginCondition };

const TooltipEmojiContainer: FC<Props> = ({ condition }) => {
  if (condition.type !== 'emoji') {
    return null;
  }
  return <span className='rad:text-lg rad:cursor-default'>{condition.emoji}</span>;
};

export default TooltipEmojiContainer;

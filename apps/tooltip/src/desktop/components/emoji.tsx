import type { FC } from 'react';
import type { PluginCondition } from '@/schema/plugin-config';

type Props = { condition: PluginCondition };

const TooltipEmojiContainer: FC<Props> = ({ condition }) => {
  if (condition.type !== 'emoji') {
    return null;
  }
  return <span className='rad:text-lg rad:cursor-default'>{condition.emoji}</span>;
};

export default TooltipEmojiContainer;

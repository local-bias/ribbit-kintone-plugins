import { TooltipIcon } from '@/lib/components/tooltip-icon';
import { PluginCondition } from '@/schema/plugin-config';

type Props = { condition: PluginCondition };

export default function TooltipIconContainerMemo({ condition }: Props) {
  if (condition.type !== 'icon') {
    return null;
  }
  return <TooltipIcon iconType={condition.iconType} iconColor={condition.iconColor} />;
}

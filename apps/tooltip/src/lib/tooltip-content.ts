import type { PluginCondition } from '@/schema/plugin-config';

type TooltipContentSource = Pick<PluginCondition, 'contentMode' | 'html' | 'label'>;

export function getTooltipContentHtml(condition: TooltipContentSource): string {
  return condition.contentMode === 'html' ? condition.html : condition.label;
}

import { styled } from '@mui/material/styles';
import type { ToolStatus } from '@/lib/ai/chat-items';
import { t } from '@/lib/i18n';

/** 折りたたんだ中に出す結果の上限(長いJSONで画面を埋めない) */
const MAX_PREVIEW_CHARS = 2048;

const Details = styled('details')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  fontSize: 12,
  '& > summary': {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '4px 8px',
    cursor: 'pointer',
    listStyle: 'none',
  },
  '& > summary::-webkit-details-marker': { display: 'none' },
  '& > summary:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 1,
  },
  '& pre': {
    margin: 0,
    padding: '4px 8px 8px',
    maxHeight: 240,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
}));

const STATUS_MARK: Record<ToolStatus, string> = {
  done: '✓',
  error: '⚠',
  denied: '✕',
  'awaiting-approval': '…',
  running: '…',
  interrupted: '—',
};

const TOOL_LABEL_KEYS = {
  get_app_context: 'desktop.chat.tool.get_app_context',
  get_form_fields: 'desktop.chat.tool.get_form_fields',
  get_form_layout: 'desktop.chat.tool.get_form_layout',
  get_views: 'desktop.chat.tool.get_views',
  query_dom: 'desktop.chat.tool.query_dom',
  list_assets: 'desktop.chat.tool.list_assets',
  read_asset: 'desktop.chat.tool.read_asset',
  get_record_sample: 'desktop.chat.tool.get_record_sample',
} as const;

export const toolLabel = (toolName: string): string =>
  toolName in TOOL_LABEL_KEYS
    ? t(TOOL_LABEL_KEYS[toolName as keyof typeof TOOL_LABEL_KEYS])
    : toolName;

const preview = (value: unknown): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return text.length > MAX_PREVIEW_CHARS ? `${text.slice(0, MAX_PREVIEW_CHARS)}…` : text;
};

/**
 * AIのツール呼び出し1件(既定は折りたたみ)。往復ごとに積まれるので、ストリーミングの代わりの進捗にもなる
 *
 * @see docs/06-ui.md 6章
 */
export function ToolCallCard(props: {
  toolName: string;
  input: unknown;
  status: ToolStatus;
  output?: unknown;
}) {
  const { toolName, input, status, output } = props;
  return (
    <Details>
      <summary>
        <span aria-hidden='true'>🔧</span>
        <span style={{ flex: 1 }}>{toolLabel(toolName)}</span>
        <span>
          {STATUS_MARK[status]} {t(`desktop.chat.tool.status.${status}`)}
        </span>
      </summary>
      <div>
        <strong style={{ padding: '0 8px' }}>{t('desktop.chat.tool.input')}</strong>
        <pre>{preview(input)}</pre>
        {output !== undefined && (
          <>
            <strong style={{ padding: '0 8px' }}>{t('desktop.chat.tool.output')}</strong>
            <pre>{preview(output)}</pre>
          </>
        )}
      </div>
    </Details>
  );
}

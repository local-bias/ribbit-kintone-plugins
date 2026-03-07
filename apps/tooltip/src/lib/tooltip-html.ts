import DOMPurify from 'dompurify';

const HTML_TAG_PATTERN = /<\/?[a-z][\w:-]*(?:\s[^>]*)?>/i;

const HTML_ESCAPE_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_ENTITIES[character] ?? character);
}

export function normalizeTooltipHtml(value: string): string {
  if (!value) {
    return '';
  }
  if (HTML_TAG_PATTERN.test(value)) {
    return value;
  }
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>');
}

export function sanitizeTooltipHtml(value: string): string {
  return DOMPurify.sanitize(normalizeTooltipHtml(value));
}

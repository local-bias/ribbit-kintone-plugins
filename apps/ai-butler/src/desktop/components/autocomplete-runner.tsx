import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { pluginConfigAtom, validPluginConditionsAtom } from '@/desktop/public-state';
import { chatComplete } from '@/lib/ai';
import type { AutocompleteRule } from '@/schema/plugin-config';

const Tooltip = styled.div`
  position: absolute;
  z-index: 9000;
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #222;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
`;

const SuggestionText = styled.div`
  max-width: 320px;
  word-break: break-word;
  white-space: pre-wrap;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const Button = styled.button<{ primary?: boolean }>`
  border: 1px solid ${(p) => (p.primary ? '#3498db' : '#d0d7de')};
  background: ${(p) => (p.primary ? '#3498db' : '#fff')};
  color: ${(p) => (p.primary ? '#fff' : '#333')};
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

interface Suggestion {
  rule: AutocompleteRule;
  value: string;
  rect: DOMRect;
}

/** field 要素を取得 (kintone のクラス命名: `[class*="field-"]` + label) */
function getFieldContainer(fieldCode: string): HTMLElement | null {
  const el = kintone.app.record.getFieldElement(fieldCode);
  return el as HTMLElement | null;
}

function getFieldInput(fieldCode: string): HTMLInputElement | HTMLTextAreaElement | null {
  const container = getFieldContainer(fieldCode);
  if (!container) return null;
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  return input;
}

function getFieldValue(fieldCode: string): string {
  try {
    const record = kintone.app.record.get();
    const value = record?.record?.[fieldCode]?.value;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    return value == null ? '' : String(value);
  } catch {
    return '';
  }
}

function setFieldValue(fieldCode: string, value: string) {
  try {
    const record = kintone.app.record.get();
    if (!record?.record[fieldCode]) return false;
    record.record[fieldCode] = {
      ...record.record[fieldCode],
      value,
    } as never;
    kintone.app.record.set(record);
    return true;
  } catch (error) {
    console.error('[ai-butler] failed to set field value', error);
    return false;
  }
}

function AutocompleteRunner() {
  const config = useAtomValue(pluginConfigAtom);
  const conditions = useAtomValue(validPluginConditionsAtom);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const inflightRef = useRef<{ ruleId: string; value: string } | null>(null);

  // autocomplete=true & 各 condition の trigger が autocomplete のものを集約
  const rules = useMemo<AutocompleteRule[]>(() => {
    if (!config.common.autocompleteEnabled) return [];
    return conditions
      .filter((c) => c.trigger === 'autocomplete')
      .flatMap((c) => c.autocompleteRules)
      .filter((r) => r.sourceFieldCode && r.targetFieldCode && r.instruction);
  }, [config.common.autocompleteEnabled, conditions]);

  // 各 source field の change を監視
  useEffect(() => {
    if (rules.length === 0) return;
    const cleanups: Array<() => void> = [];

    for (const rule of rules) {
      const input = getFieldInput(rule.sourceFieldCode);
      if (!input) continue;

      const debounceTimer: { current: number | null } = { current: null };

      const handler = () => {
        const value = input.value.trim();
        if (debounceTimer.current) {
          window.clearTimeout(debounceTimer.current);
        }
        if (!value) {
          setSuggestion((prev) => (prev?.rule.id === rule.id ? null : prev));
          return;
        }
        // すでに同一値で生成中なら無視
        if (inflightRef.current?.ruleId === rule.id && inflightRef.current.value === value) {
          return;
        }
        debounceTimer.current = window.setTimeout(async () => {
          inflightRef.current = { ruleId: rule.id, value };
          try {
            const { content } = await chatComplete(config.common, [
              { role: 'system', content: rule.instruction },
              { role: 'user', content: value },
            ]);
            const cleaned = content.trim().replace(/^["「『]|["」』]$/g, '');
            // 値が古い場合は捨てる
            if (inflightRef.current?.ruleId !== rule.id || inflightRef.current.value !== value) {
              return;
            }
            // 既に対象に値があるならスキップ
            const existing = getFieldValue(rule.targetFieldCode);
            if (existing) {
              return;
            }
            const target = getFieldContainer(rule.targetFieldCode);
            if (!target) return;
            const rect = target.getBoundingClientRect();
            setSuggestion({ rule, value: cleaned, rect });
          } catch (error) {
            console.error('[ai-butler] autocomplete error', error);
          } finally {
            if (inflightRef.current?.ruleId === rule.id && inflightRef.current.value === value) {
              inflightRef.current = null;
            }
          }
        }, 800);
      };

      input.addEventListener('blur', handler);
      input.addEventListener('change', handler);

      cleanups.push(() => {
        input.removeEventListener('blur', handler);
        input.removeEventListener('change', handler);
        if (debounceTimer.current) {
          window.clearTimeout(debounceTimer.current);
        }
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [config.common, rules]);

  if (!suggestion) return null;
  const top = window.scrollY + suggestion.rect.bottom + 6;
  const left = window.scrollX + suggestion.rect.left;

  const accept = () => {
    setFieldValue(suggestion.rule.targetFieldCode, suggestion.value);
    setSuggestion(null);
  };
  const reject = () => setSuggestion(null);

  return (
    <Tooltip style={{ top, left }}>
      <div style={{ fontSize: 11, color: '#3498db', fontWeight: 'bold' }}>🪄 AI からの提案</div>
      <SuggestionText>{suggestion.value}</SuggestionText>
      <ButtonRow>
        <Button onClick={reject}>却下</Button>
        <Button primary onClick={accept}>
          採用
        </Button>
      </ButtonRow>
    </Tooltip>
  );
}

export default AutocompleteRunner;

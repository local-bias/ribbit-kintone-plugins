import styled from '@emotion/styled';
import { useAtom, useAtomValue, useSetAtom } from '@repo/jotai';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { pluginConfigAtom, validPluginConditionsAtom } from '@/desktop/public-state';
import {
  attachedFilesAtom,
  chatOpenAtom,
  fileAttachOpenAtom,
  isThinkingAtom,
  selectedConditionIdAtom,
} from '@/desktop/states/chat';
import { chatComplete } from '@/lib/ai';

const DropZone = styled.div<{ active: boolean }>`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 300px;
  height: 180px;
  background: linear-gradient(135deg, #3498db, #2c3e50);
  border-radius: 16px;
  border: 3px dashed rgba(255, 255, 255, 0.85);
  box-shadow: 0 16px 48px rgba(52, 152, 219, 0.45);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #fff;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  transform-origin: bottom right;
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 180ms ease;
  transform: ${(p) => (p.active ? 'scale(1) translateY(0)' : 'scale(0.18) translateY(0)')};
  opacity: ${(p) => (p.active ? 1 : 0)};
  pointer-events: ${(p) => (p.active ? 'auto' : 'none')};
  text-align: center;
  padding: 16px;
`;

const DropIcon = styled.div`
  font-size: 36px;
  line-height: 1;
  animation: ai-butler-bounce 1.2s ease-in-out infinite;
  @keyframes ai-butler-bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }
`;

const DropTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
`;

const DropHint = styled.div`
  font-size: 11px;
  opacity: 0.85;
  font-weight: normal;
`;

async function fileToText(file: File): Promise<string> {
  const isText =
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    /\.(md|txt|csv|json|xml|yaml|yml|log)$/i.test(file.name);
  if (isText) {
    return await file.text();
  }
  return `(添付ファイル: ${file.name}, ${file.type || 'unknown'}, ${file.size} bytes)`;
}

/**
 * ファイル添付による自動フィールド補完を実行します
 */
async function runFileAutoFill(params: {
  files: File[];
  systemPrompt: string;
  targetFieldCodes: string[];
  common: import('@/schema/plugin-config').PluginCommonConfig;
}) {
  const { files, systemPrompt, targetFieldCodes, common } = params;
  if (targetFieldCodes.length === 0) {
    toast.warning('対象フィールドが設定されていないため、自動補完できません。');
    return;
  }
  const contents = await Promise.all(files.map((f) => fileToText(f)));
  const userPrompt = [
    '以下の添付ファイルから、指定された各フィールドに入る最も適切な値を JSON で返してください。',
    'JSON のキーはフィールドコード、値は文字列にしてください。',
    `対象フィールドコード: ${targetFieldCodes.join(', ')}`,
    '',
    ...files.map((f, i) => `## ${f.name}\n${contents[i]}`),
  ].join('\n');

  const { content } = await chatComplete(common, [
    {
      role: 'system',
      content:
        (systemPrompt ? `${systemPrompt}\n` : '') +
        '出力は厳密に JSON オブジェクトのみとし、説明文や ```json``` 等のコードブロック装飾は不要です。',
    },
    { role: 'user', content: userPrompt },
  ]);

  // JSON 抽出
  const jsonText = content
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .trim();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error('[ai-butler] failed to parse AI response as JSON', error, content);
    toast.error('AI 応答を JSON として解析できませんでした');
    return;
  }
  if (!parsed || typeof parsed !== 'object') {
    toast.error('AI 応答が JSON オブジェクトではありません');
    return;
  }

  // kintone レコードに反映 (詳細/作成/編集画面のみ可能)
  try {
    const record = kintone.app.record.get();
    if (!record) {
      toast.warning('現在の画面はレコード編集画面ではありません');
      return;
    }
    let updated = 0;
    for (const code of targetFieldCodes) {
      if (!(code in parsed)) continue;
      if (record.record[code]) {
        record.record[code] = {
          ...record.record[code],
          value: String(parsed[code] ?? ''),
        } as never;
        updated += 1;
      }
    }
    kintone.app.record.set(record);
    toast.success(`${updated} 件のフィールドを自動補完しました`);
  } catch (error) {
    console.error('[ai-butler] failed to set record', error);
    toast.error('フィールドの更新に失敗しました');
  }
}

function FileDropOverlay() {
  const [overlayActive, setOverlayActive] = useAtom(fileAttachOpenAtom);
  const setFiles = useSetAtom(attachedFilesAtom);
  const setChatOpen = useSetAtom(chatOpenAtom);
  const setIsThinking = useSetAtom(isThinkingAtom);
  const config = useAtomValue(pluginConfigAtom);
  const conditions = useAtomValue(validPluginConditionsAtom);
  const selectedConditionId = useAtomValue(selectedConditionIdAtom);
  // ドラッグ enter/leave のカウント (ネストされた要素対策)
  const dragCounter = useRef(0);

  const enabled = config.common.fileAttachmentEnabled;

  const onDragEnter = useCallback(
    (event: DragEvent) => {
      if (!enabled) return;
      if (!event.dataTransfer || !Array.from(event.dataTransfer.types).includes('Files')) {
        return;
      }
      event.preventDefault();
      dragCounter.current += 1;
      if (dragCounter.current === 1) {
        setOverlayActive(true);
      }
    },
    [enabled, setOverlayActive]
  );

  const onDragLeave = useCallback(
    (event: DragEvent) => {
      if (!enabled) return;
      event.preventDefault();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setOverlayActive(false);
      }
    },
    [enabled, setOverlayActive]
  );

  const onDragOver = useCallback(
    (event: DragEvent) => {
      if (!enabled) return;
      event.preventDefault();
    },
    [enabled]
  );

  const onDrop = useCallback(
    async (event: DragEvent) => {
      if (!enabled) return;
      event.preventDefault();
      dragCounter.current = 0;
      setOverlayActive(false);
      const dropped = Array.from(event.dataTransfer?.files ?? []);
      if (dropped.length === 0) return;

      setFiles((prev) => [...prev, ...dropped]);
      setChatOpen(true);

      // 自動補完が有効ならそのまま AI 実行
      if (config.common.autoFillOnFileDrop) {
        const condition =
          conditions.find((c) => c.id === selectedConditionId) ??
          conditions.find((c) => c.trigger === 'fileDrop') ??
          null;
        if (!condition) {
          toast.info('fileDrop トリガーのプロンプトが見つからないため、自動補完をスキップしました');
          return;
        }
        try {
          setIsThinking(true);
          await runFileAutoFill({
            files: dropped,
            systemPrompt: condition.systemPrompt,
            targetFieldCodes: condition.targetFieldCodes,
            common: config.common,
          });
        } catch (error) {
          console.error('[ai-butler] auto fill error', error);
          toast.error(
            error instanceof Error ? error.message : 'ファイル自動補完中にエラーが発生しました'
          );
        } finally {
          setIsThinking(false);
        }
      }
    },
    [
      enabled,
      setOverlayActive,
      setFiles,
      setChatOpen,
      config.common,
      conditions,
      selectedConditionId,
      setIsThinking,
    ]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [enabled, onDragEnter, onDragLeave, onDragOver, onDrop]);

  return (
    <DropZone active={overlayActive}>
      <DropIcon>📎</DropIcon>
      <DropTitle>ファイルをドロップ</DropTitle>
      <DropHint>
        {config.common.autoFillOnFileDrop
          ? '自動でフィールド補完を実行します'
          : 'チャットに添付されます'}
      </DropHint>
    </DropZone>
  );
}

export default FileDropOverlay;

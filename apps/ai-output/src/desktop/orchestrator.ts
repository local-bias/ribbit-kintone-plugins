import type { PluginCondition, ResolvedOutputFieldDef } from '@/schema/plugin-config';
import { resolveLocalPlaceholders, resolveExternalPlaceholders } from './template-resolver';
import { buildResponseSchema } from './schema-builder';
import { collectReferencedAttachments } from './file-attachments';
import { resolveOutputFields } from './field-resolver';
import { callOpenAI } from './openai-client';
import { dialog } from '@konomi-app/ui';

interface AIInferenceResult {
  aiResponse: Record<string, unknown>;
  resolvedFields: ResolvedOutputFieldDef[];
}

/**
 * AI自動入力を実行し、生のAIレスポンスと補完済みフィールド定義を返す。
 * レコードの読み書きは呼び出し側の責務とする。
 */
export async function executeAIInference(
  condition: PluginCondition,
  record: Record<string, { type: string; value: unknown }>
): Promise<AIInferenceResult> {
  try {
    dialog.showQueue(
      [
        { key: 'collecting', label: '処理に必要な情報の収集' },
        { key: 'thinking', label: 'AIによる回答の生成' },
      ],
      'AIに内容を考えてもらっています...'
    );
    dialog.activateQueue('collecting');
    const loginUser = kintone.getLoginUser();
    const allAttachments = await collectReferencedAttachments(condition.systemPrompt, record);

    // テキスト添付はプロンプトに埋め込み、バイナリ添付は content part として送信
    const textAttachments = allAttachments.filter(
      (a): a is Extract<(typeof allAttachments)[number], { type: 'text' }> => a.type === 'text'
    );
    const binaryAttachments = allAttachments.filter(
      (a): a is Exclude<(typeof allAttachments)[number], { type: 'text' }> => a.type !== 'text'
    );

    // 第1パス: ローカルプレースホルダーの解決
    const afterFirstPass = resolveLocalPlaceholders(condition.systemPrompt, record, {
      name: loginUser.name,
      code: loginUser.code,
      email: loginUser.email,
    });

    // 第2パス: 外部アプリ参照の解決
    let resolvedPrompt = await resolveExternalPlaceholders(
      afterFirstPass,
      condition.maxExternalRecords
    );

    // テキスト系ファイルの内容をプロンプト末尾に追加
    if (textAttachments.length > 0) {
      resolvedPrompt +=
        '\n\n## 添付ファイル\n\n' + textAttachments.map((a) => a.content).join('\n\n');
    }

    // getFormFields APIでフィールド情報を取得し、出力フィールド定義を補完
    const resolvedFields = await resolveOutputFields(condition.outputFields);
    if (resolvedFields.length === 0) {
      throw new Error('出力フィールドが設定されていません');
    }
    const responseSchema = buildResponseSchema(resolvedFields);
    dialog.completeQueue('collecting');

    // OpenAI APIリクエスト

    dialog.activateQueue('thinking');
    const aiResponse = await callOpenAI({
      attachments: binaryAttachments,
      model: condition.aiModel,
      systemPrompt: resolvedPrompt,
      responseSchema,
      temperature: condition.temperature,
      timeoutMs: condition.apiTimeout * 1000,
    });
    dialog.completeQueue('thinking');

    return { aiResponse, resolvedFields };
  } finally {
    dialog.hide();
  }
}

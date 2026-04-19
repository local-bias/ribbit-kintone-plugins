import { GUEST_SPACE_ID } from '@/lib/global';
import type {
  OutputFieldDef,
  OutputFieldType,
  ResolvedOutputFieldDef,
} from '@/schema/plugin-config';
import { getFormFields, kintoneAPI } from '@konomi-app/kintone-utilities';

/** kintoneフィールドタイプから出力フィールドタイプへのマッピング */
function inferOutputFieldType(kintoneType: string): OutputFieldType {
  switch (kintoneType) {
    case 'NUMBER':
    case 'CALC':
      return 'number';
    case 'CHECK_BOX':
    case 'MULTI_SELECT':
      return 'array_string';
    default:
      return 'string';
  }
}

/**
 * getFormFields APIレスポンスを使って、保存された出力フィールド定義にlabelとtypeを補完する
 */
export async function resolveOutputFields(
  outputFields: OutputFieldDef[]
): Promise<ResolvedOutputFieldDef[]> {
  const appId = kintone.app.getId();
  if (!appId) {
    throw new Error('アプリIDを取得できませんでした');
  }

  const { properties } = await getFormFields({
    app: appId,
    guestSpaceId: GUEST_SPACE_ID,
  });

  const fieldMap = new Map<string, kintoneAPI.FieldProperty>();
  for (const [code, prop] of Object.entries(properties)) {
    fieldMap.set(code, prop as kintoneAPI.FieldProperty);
  }

  return outputFields
    .filter((f) => !!f.fieldCode)
    .map((f) => {
      const prop = fieldMap.get(f.fieldCode);
      return {
        fieldCode: f.fieldCode,
        description: f.description,
        label: prop && 'label' in prop ? (prop.label as string) : f.fieldCode,
        type: prop ? inferOutputFieldType(prop.type) : 'string',
      };
    });
}

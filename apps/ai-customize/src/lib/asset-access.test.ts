import { describe, expect, test } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import { type AclRight, evaluateAssetAccess, NO_ACCESS } from './asset-access';

const ALL_FIELDS = ['status', 'scope', 'order', 'code', 'permissions', 'externalUrls'];

/** 実際のAPIと同じく、アクセス権を設定していないフィールドも含めて返す */
const right = (
  id: string,
  record: Partial<AclRight['record']> = {},
  fields: AclRight['fields'] = {}
): AclRight => ({
  id,
  record: { viewable: true, editable: true, deletable: true, ...record },
  fields: {
    ...Object.fromEntries(ALL_FIELDS.map((code) => [code, { viewable: true, editable: true }])),
    ...fields,
  },
});

const codes = createTestCommonConfig();
const readOnlyField = { viewable: true, editable: false };

describe('evaluateAssetAccess', () => {
  test('レコードとフィールドを編集できれば、全ての操作ができる', () => {
    expect(evaluateAssetAccess([right('1')], codes).get('1')).toEqual({
      canToggleStatus: true,
      canChangeScope: true,
      canReorder: true,
      canEditCode: true,
      canEditPermissions: true,
      canEditExternalUrls: true,
      canDelete: true,
      unavailable: false,
    });
  });

  test('UI要素ごとに、書き込むフィールドの権限を見る(推奨のアクセス権)', () => {
    const access = evaluateAssetAccess(
      [right('1', {}, { status: readOnlyField, scope: readOnlyField, code: readOnlyField })],
      codes
    ).get('1');
    expect(access).toMatchObject({
      canToggleStatus: false,
      canChangeScope: false,
      canEditCode: false,
      canReorder: true,
      canEditPermissions: true,
      canEditExternalUrls: true,
    });
  });

  test('レコードを編集できなければ、フィールドが編集可で返っても操作できない', () => {
    const access = evaluateAssetAccess(
      [
        right(
          '1',
          { editable: false, deletable: false },
          { status: { viewable: true, editable: true } }
        ),
      ],
      codes
    ).get('1');
    expect(access).toEqual(NO_ACCESS);
  });

  test('任意フィールドを対応付けていなければ、その操作はできない', () => {
    const access = evaluateAssetAccess(
      [right('1')],
      createTestCommonConfig({ orderFieldCode: '', externalUrlsFieldCode: '' })
    ).get('1');
    expect(access).toMatchObject({ canReorder: false, canEditExternalUrls: false });
  });

  test('通信先は、「権限」と「通信先」の両方を編集できるときだけ編集できる', () => {
    const access = evaluateAssetAccess([right('1', {}, { permissions: readOnlyField })], codes).get(
      '1'
    );
    expect(access).toMatchObject({ canEditPermissions: false, canEditExternalUrls: false });
  });

  test('設定のフィールドコードが返らなければ(管理アプリに無い)、その操作はできない', () => {
    const access = evaluateAssetAccess(
      [{ id: '1', record: { viewable: true, editable: true, deletable: true }, fields: {} }],
      codes
    ).get('1');
    expect(access).toEqual({ ...NO_ACCESS, canDelete: true });
  });

  test('削除はレコード単位の deletable に従う', () => {
    expect(evaluateAssetAccess([right('1', { deletable: false })], codes).get('1')?.canDelete).toBe(
      false
    );
  });

  test('読めているレコードが閲覧不可で返るのはメンテナンス中など。権限なしと区別する', () => {
    const access = evaluateAssetAccess(
      [right('1', { viewable: false, editable: false, deletable: false })],
      codes
    );
    expect(access.get('1')).toEqual({ ...NO_ACCESS, unavailable: true });
  });
});

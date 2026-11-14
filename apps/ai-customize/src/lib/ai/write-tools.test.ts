import { describe, expect, test, vi } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import { createTestWriteServices, FULL_ACCESS } from './test-write-services';
import type { ApprovalOverride, WriteAssetInput } from './write-approval';
import { createWriteTools, isRejectedBeforeApproval, type WriteToolServices } from './write-tools';

type Tools = ReturnType<typeof createWriteTools>;

/** ツールを、SDKが承認後に呼ぶのと同じ形で実行する */
const execute = async <K extends keyof Tools>(
  tools: Tools,
  name: K,
  input: unknown,
  approvals: Record<string, ApprovalOverride> = {},
  toolCallId = 'call-1'
) => {
  const run = tools[name].execute as unknown as (
    input: unknown,
    options: { toolCallId: string; messages: []; context: { approvals: typeof approvals } }
  ) => Promise<Record<string, unknown>>;
  return run(input, { toolCallId, messages: [], context: { approvals } });
};

const approved = (override: ApprovalOverride = {}) => ({ 'call-1': override });

const newCss = (overrides: Partial<WriteAssetInput> = {}): WriteAssetInput => ({
  kind: 'css',
  title: '失注をグレーに',
  code: '.row { color: gray; }',
  permissions: [],
  externalUrls: [],
  ...overrides,
});

const existing = createTestAsset({
  id: '7',
  revision: '3',
  kind: 'js',
  scope: 'private',
  enabled: true,
  ownerCode: 'sato',
  code: "kintone.api('/k/v1/record.json', 'PUT', {});",
  permissions: ['put'],
});

const updateInput = (overrides: Partial<WriteAssetInput> = {}): WriteAssetInput => ({
  id: '7',
  revision: '3',
  kind: 'js',
  title: '更新',
  code: "kintone.api('/k/v1/record.json', 'PUT', {});\nkintone.api('/k/v1/record.json', 'POST', {});",
  permissions: ['put', 'post'],
  externalUrls: [],
  ...overrides,
});

const setup = (params: Parameters<typeof createTestWriteServices>[0] = {}) => {
  const services = createTestWriteServices({ assets: [existing], ...params });
  return { services, tools: createWriteTools(services) };
};

describe('write_asset(新規)', () => {
  test('承認されたCSSを、自分だけ・指定どおりに保存する。「保存後すぐ有効」は利用者が選んだときだけ', async () => {
    const { services, tools } = setup();
    const result = await execute(
      tools,
      'write_asset',
      newCss(),
      approved({ enableAfterSave: true })
    );
    expect(services.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'css', scope: 'private', enabled: true, permissions: [] })
    );
    expect(result).toMatchObject({
      status: 'saved',
      operation: 'created',
      id: '50',
      enabled: true,
      appliedScope: 'private',
      overriddenByUser: false,
    });
    expect(services.onChanged).toHaveBeenCalledWith({
      type: 'saved',
      assetId: '50',
      kind: 'css',
      reloadRequired: false,
    });

    const { services: other, tools: otherTools } = setup();
    await execute(otherTools, 'write_asset', newCss(), approved());
    expect(other.createAsset).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  test('新規のJSは、利用者が有効を選んでも無効で保存する', async () => {
    const { services, tools } = setup();
    await execute(
      tools,
      'write_asset',
      newCss({ kind: 'js', code: 'const a = 1;' }),
      approved({ enableAfterSave: true })
    );
    expect(services.createAsset).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  test('承認されていない呼び出しでは保存しない', async () => {
    const { services, tools } = setup();
    expect(await execute(tools, 'write_asset', newCss(), {})).toMatchObject({
      status: 'rejected',
      reason: 'not-approved',
    });
    expect(services.createAsset).not.toHaveBeenCalled();
  });

  test('コードに問題があれば、承認されていても保存せず理由を返す', async () => {
    const { services, tools } = setup();
    const result = await execute(
      tools,
      'write_asset',
      newCss({ kind: 'js', code: "fetch('/x');" }),
      approved()
    );
    expect(result).toMatchObject({
      status: 'rejected',
      reason: 'invalid-code',
      errors: [{ type: 'bypass', pattern: 'fetch', line: 1 }],
    });
    expect(services.createAsset).not.toHaveBeenCalled();
  });

  test('利用者の上書きで影響範囲・権限・送信先を減らし、適用した値を返す。増やす上書きは無視する', async () => {
    const { services, tools } = setup({ canPublish: true });
    const input = newCss({
      kind: 'js',
      scope: 'public',
      code: [
        "kintone.api('/k/v1/record.json', 'PUT', {});",
        "kintone.proxy('https://api.example.com/v1/zip', 'GET', {}, {});",
      ].join('\n'),
      permissions: ['put'],
      externalUrls: ['https://api.example.com/v1/'],
    });
    const result = await execute(
      tools,
      'write_asset',
      input,
      approved({ scope: 'private', permissions: ['delete'], externalUrls: [] })
    );
    expect(services.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'private', permissions: [], externalUrlsText: '' })
    );
    expect(result).toMatchObject({
      appliedScope: 'private',
      appliedPermissions: [],
      appliedExternalUrls: [],
      overriddenByUser: true,
    });
  });

  test('送信先があれば「外部通信(指定先のみ)」を付け、通信先を1行1件で書く', async () => {
    const { services, tools } = setup();
    await execute(
      tools,
      'write_asset',
      newCss({
        kind: 'js',
        code: "kintone.proxy('https://api.example.com/v1/zip', 'GET', {}, {});",
        externalUrls: ['https://api.example.com/v1'],
      }),
      approved()
    );
    expect(services.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: ['external-listed'],
        externalUrlsText: 'https://api.example.com/v1',
      })
    );
  });

  test('公開権限が無ければ「全員」では保存しない', async () => {
    const { services, tools } = setup({ canPublish: false });
    expect(
      await execute(tools, 'write_asset', newCss({ scope: 'public' }), approved())
    ).toMatchObject({ reason: 'no-publish-permission' });
    expect(services.createAsset).not.toHaveBeenCalled();
  });

  test('上限に達していれば登録しない', async () => {
    const { tools } = setup({
      overrides: { countAssets: vi.fn(async () => 100) } as Partial<WriteToolServices>,
    });
    expect(await execute(tools, 'write_asset', newCss(), approved())).toMatchObject({
      reason: 'too-many',
    });
  });

  test('同じツール呼び出しは2回保存しない(再開の再試行でSDKが再実行しても)', async () => {
    const { services, tools } = setup();
    const first = await execute(tools, 'write_asset', newCss(), approved());
    const second = await execute(tools, 'write_asset', newCss(), approved());
    expect(second).toEqual(first);
    expect(services.createAsset).toHaveBeenCalledTimes(1);
  });
});

describe('write_asset(取り違え・CSS)', () => {
  test('toolCallIdが同じでも入力が違えば別の呼び出しとして保存する', async () => {
    const { services, tools } = setup();
    await execute(tools, 'write_asset', newCss({ title: 'A' }), approved());
    await execute(tools, 'write_asset', newCss({ title: 'B' }), approved());
    expect(services.createAsset).toHaveBeenCalledTimes(2);
  });

  test('CSSに書き込み権限を付けても保存しない(後でJSへ変えたときに、確認していない権限を残さない)', async () => {
    const { services, tools } = setup();
    const result = await execute(
      tools,
      'write_asset',
      newCss({ permissions: ['delete'] }),
      approved()
    );
    expect(services.createAsset).toHaveBeenCalledWith(expect.objectContaining({ permissions: [] }));
    expect(result).toMatchObject({ appliedPermissions: [] });
  });
});

describe('write_asset(更新)', () => {
  test('取り直したアセットを再検証して、変えた項目と権限を明示的に書く。有効・無効は変えない', async () => {
    const { services, tools } = setup();
    const result = await execute(tools, 'write_asset', updateInput(), approved());
    expect(services.updateAsset).toHaveBeenCalledWith(existing, {
      title: '更新',
      code: updateInput().code,
      permissions: ['post', 'put'],
      externalUrlsText: '',
    });
    expect(result).toMatchObject({
      status: 'saved',
      operation: 'updated',
      enabled: true,
      appliedScope: 'private',
      reloadRequired: true,
    });
  });

  test('revisionが違えば読み直させる', async () => {
    const { services, tools } = setup();
    expect(
      await execute(tools, 'write_asset', updateInput({ revision: '2' }), approved())
    ).toMatchObject({ reason: 'conflict' });
    expect(services.updateAsset).not.toHaveBeenCalled();
  });

  test('別のアプリや他人のprivateは、存在も伝えずに拒否する', async () => {
    for (const asset of [
      { ...existing, targetAppId: '1' },
      { ...existing, ownerCode: 'tanaka' },
    ]) {
      const { services, tools } = setup({ assets: [asset] });
      expect(await execute(tools, 'write_asset', updateInput(), approved())).toMatchObject({
        reason: 'not-found',
      });
      expect(services.updateAsset).not.toHaveBeenCalled();
    }
  });

  test('人が付けた強い権限があるものはAIから更新しない', async () => {
    const { tools } = setup({
      assets: [{ ...existing, permissions: ['put', 'unrestricted'] }],
    });
    expect(await execute(tools, 'write_asset', updateInput(), approved())).toMatchObject({
      reason: 'human-only-permissions',
    });
  });

  test('レコードを編集できなければ拒否する', async () => {
    const { tools } = setup({ access: { ...FULL_ACCESS, canEditCode: false } });
    expect(await execute(tools, 'write_asset', updateInput(), approved())).toMatchObject({
      reason: 'no-access',
    });
  });

  test('種別は変えられない', async () => {
    const { tools } = setup();
    expect(
      await execute(
        tools,
        'write_asset',
        updateInput({ kind: 'css', code: '.a{}', permissions: [] }),
        approved()
      )
    ).toMatchObject({ reason: 'kind-mismatch' });
  });
});

describe('set_asset_state', () => {
  test('有効にする。JSは再読み込みで反映される', async () => {
    const { services, tools } = setup({ assets: [{ ...existing, enabled: false }] });
    const result = await execute(
      tools,
      'set_asset_state',
      { id: '7', revision: '3', enabled: true },
      approved()
    );
    expect(services.updateAsset).toHaveBeenCalledWith(expect.objectContaining({ id: '7' }), {
      enabled: true,
    });
    expect(result).toMatchObject({ status: 'saved', enabled: true, reloadRequired: true });
  });

  test('コードで使っていない権限・送信先は追加させない', async () => {
    const { services, tools } = setup();
    expect(
      await execute(
        tools,
        'set_asset_state',
        { id: '7', revision: '3', permissions: ['put', 'delete'] },
        approved()
      )
    ).toMatchObject({ reason: 'unused-permission', unused: ['delete'] });
    expect(
      await execute(
        tools,
        'set_asset_state',
        { id: '7', revision: '3', externalUrls: ['https://api.example.com/'] },
        { 'call-2': {} },
        'call-2'
      )
    ).toMatchObject({ reason: 'unused-permission', unused: ['https://api.example.com/'] });
    expect(services.updateAsset).not.toHaveBeenCalled();
  });

  test('権限を外すのは、コードが使っていても通す', async () => {
    const { services, tools } = setup();
    await execute(
      tools,
      'set_asset_state',
      { id: '7', revision: '3', permissions: [] },
      approved()
    );
    expect(services.updateAsset).toHaveBeenCalledWith(expect.anything(), { permissions: [] });
  });

  test('変更する項目が無ければ拒否する', async () => {
    const { tools } = setup();
    expect(
      await execute(tools, 'set_asset_state', { id: '7', revision: '3' }, approved())
    ).toMatchObject({ reason: 'no-changes' });
  });

  test('「全員」へは公開権限が要る', async () => {
    const { tools } = setup({ canPublish: false });
    expect(
      await execute(
        tools,
        'set_asset_state',
        { id: '7', revision: '3', scope: 'public' },
        approved()
      )
    ).toMatchObject({ reason: 'no-publish-permission' });
  });
});

describe('delete_asset', () => {
  test('削除できる権限があれば、取り直した版で削除する', async () => {
    const { services, tools } = setup();
    const result = await execute(tools, 'delete_asset', { id: '7', reason: '不要' }, approved());
    expect(services.deleteAsset).toHaveBeenCalledWith(existing);
    expect(services.onChanged).toHaveBeenCalledWith({ type: 'deleted', asset: existing });
    expect(result).toEqual({ status: 'deleted', id: '7', title: existing.title });
  });

  test('削除の権限が無ければ拒否する。承認が無ければ何もしない', async () => {
    const { services, tools } = setup({ access: { ...FULL_ACCESS, canDelete: false } });
    expect(
      await execute(tools, 'delete_asset', { id: '7', reason: '不要' }, approved())
    ).toMatchObject({ reason: 'no-access' });
    expect(
      await execute(tools, 'delete_asset', { id: '7', reason: '不要' }, {}, 'c2')
    ).toMatchObject({
      reason: 'not-approved',
    });
    expect(services.deleteAsset).not.toHaveBeenCalled();
  });
});

describe('preview_css', () => {
  test('画面へ一時的に当てる', async () => {
    const { services, tools } = setup();
    expect(await execute(tools, 'preview_css', { code: '.a { color: red; }' })).toEqual({
      status: 'previewing',
    });
    expect(services.previewCss).toHaveBeenCalledWith('.a { color: red; }');
  });

  test('チャットが見えていなければ当てたことにしない', async () => {
    const { tools } = setup({
      overrides: { previewCss: vi.fn(() => false) } as Partial<WriteToolServices>,
    });
    expect(await execute(tools, 'preview_css', { code: '.a { color: red; }' })).toMatchObject({
      status: 'rejected',
      reason: 'preview-unavailable',
    });
  });

  test('外部の参照を含むCSSは当てない(プレビューは外部通信の権限を持たない)', async () => {
    const { services, tools } = setup();
    expect(
      await execute(tools, 'preview_css', {
        code: ".a { background: url('https://x.example.com/a.png'); }",
      })
    ).toMatchObject({ reason: 'external-reference' });
    expect(services.previewCss).not.toHaveBeenCalled();
  });
});

describe('isRejectedBeforeApproval', () => {
  test('入力だけで保存できないと分かるものは、承認を求めずに拒否の理由をAIへ返す', () => {
    const services = createTestWriteServices();
    expect(isRejectedBeforeApproval(newCss(), services)).toBe(false);
    expect(isRejectedBeforeApproval(newCss({ kind: 'js', code: 'eval(x)' }), services)).toBe(true);
  });
});

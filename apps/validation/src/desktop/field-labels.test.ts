import { beforeEach, describe, expect, test, vi } from 'vitest';

// `@/lib/global`が読み込み時に`detectGuestSpaceId`経由で`location.pathname`を参照するため、
// ゲストスペースではない通常のアプリのURLをこのテストファイル内でのみスタブする
vi.stubGlobal('location', { pathname: '/k/1/' });

const getFormFields = vi.fn();

vi.mock('@konomi-app/kintone-utilities', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@konomi-app/kintone-utilities')>()),
  getFormFields: (...args: unknown[]) => getFormFields(...args),
}));

/** モジュールスコープのキャッシュを都度リセットして読み込み直す */
async function importFieldLabels() {
  vi.resetModules();
  return import('./field-labels');
}

beforeEach(() => {
  getFormFields.mockReset();
});

describe('getFieldLabel - フィールド名の解決', () => {
  test('取得前はフィールドコードをそのまま返す', async () => {
    const { getFieldLabel } = await importFieldLabels();
    expect(getFieldLabel('name')).toBe('name');
  });

  test('取得後はフィールド名を返す', async () => {
    getFormFields.mockResolvedValue({
      properties: {
        name: { type: 'SINGLE_LINE_TEXT', code: 'name', label: '氏名' },
        email: { type: 'SINGLE_LINE_TEXT', code: 'email', label: 'メールアドレス' },
      },
    });
    const { getFieldLabel, loadFieldLabels } = await importFieldLabels();
    await loadFieldLabels();

    expect(getFieldLabel('name')).toBe('氏名');
    expect(getFieldLabel('email')).toBe('メールアドレス');
  });

  test('取得できなかったフィールドはフィールドコードで代替する', async () => {
    getFormFields.mockResolvedValue({
      properties: { name: { type: 'SINGLE_LINE_TEXT', code: 'name', label: '氏名' } },
    });
    const { getFieldLabel, loadFieldLabels } = await importFieldLabels();
    await loadFieldLabels();

    expect(getFieldLabel('unknown')).toBe('unknown');
  });

  test('取得に失敗してもエラーを送出せず、フィールドコードで代替する', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getFormFields.mockRejectedValue(new Error('failed'));
    const { getFieldLabel, loadFieldLabels } = await importFieldLabels();

    await expect(loadFieldLabels()).resolves.toBeUndefined();
    expect(getFieldLabel('name')).toBe('name');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('アプリIDが取得できない場合は問い合わせず、フィールドコードで代替する', async () => {
    const getId = vi.spyOn(kintone.app, 'getId').mockReturnValue(null);
    const { getFieldLabel, loadFieldLabels } = await importFieldLabels();

    await expect(loadFieldLabels()).resolves.toBeUndefined();
    expect(getFormFields).not.toHaveBeenCalled();
    expect(getFieldLabel('name')).toBe('name');
    getId.mockRestore();
  });

  test('複数回呼び出してもフィールド情報の取得は1回だけ', async () => {
    getFormFields.mockResolvedValue({ properties: {} });
    const { loadFieldLabels } = await importFieldLabels();

    await Promise.all([loadFieldLabels(), loadFieldLabels()]);
    await loadFieldLabels();

    expect(getFormFields).toHaveBeenCalledTimes(1);
  });
});

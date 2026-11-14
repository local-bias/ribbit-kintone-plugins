import { describe, expect, test } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import { createInjector, type DocumentLike, type StyleLike } from './injector';

type FakeStyle = StyleLike & { attributes: Record<string, string> };

const createFakeDocument = () => {
  const head: FakeStyle[] = [];
  const detach = (node: FakeStyle) => {
    const index = head.indexOf(node);
    if (index !== -1) head.splice(index, 1);
  };
  const document: DocumentLike = {
    createElement: () => {
      const style: FakeStyle = {
        textContent: null,
        disabled: false,
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        remove() {
          detach(this);
        },
      };
      return style;
    },
    // 本物の appendChild と同じく、既にある要素は末尾へ移す
    head: {
      appendChild: (node) => {
        detach(node as FakeStyle);
        head.push(node as FakeStyle);
      },
    },
  };
  return { document, head };
};

describe('createInjector', () => {
  test('CSSアセットを実行順に head の末尾へ挿入する', () => {
    const { document, head } = createFakeDocument();
    createInjector(document).sync(
      [
        createTestAsset({ id: '2', kind: 'css', code: '.a{}' }),
        createTestAsset({ id: '5', kind: 'css', code: '.b{}', scope: 'private' }),
        createTestAsset({ id: '9', kind: 'js' }),
      ],
      'detail'
    );
    expect(head.map((style) => style.textContent)).toEqual(['.a{}', '.b{}']);
    expect(head[1]?.attributes).toEqual({
      'data-ai-customize-id': '5',
      'data-ai-customize-scope': 'private',
    });
  });

  test('画面が変わったら、適用画面外の style を無効にし、戻れば有効にする', () => {
    const { document, head } = createFakeDocument();
    const injector = createInjector(document);
    const assets = [createTestAsset({ id: '1', kind: 'css', code: '.a{}', screens: ['detail'] })];
    injector.sync(assets, 'detail');
    expect(head[0]?.disabled).toBe(false);
    injector.sync(assets, 'edit');
    expect(head[0]?.disabled).toBe(true);
    injector.sync(assets, 'detail');
    expect(head[0]?.disabled).toBe(false);
    expect(head).toHaveLength(1);
  });

  test('適用画面外の style は、無効の状態で作る', () => {
    const { document, head } = createFakeDocument();
    createInjector(document).sync(
      [createTestAsset({ kind: 'css', code: '.a{}', screens: ['edit'] })],
      'detail'
    );
    expect(head.map((style) => [style.textContent, style.disabled])).toEqual([['.a{}', true]]);
  });

  test('画面ごとに適用画面が異なっても、head 内の順序は実行順のまま', () => {
    const { document, head } = createFakeDocument();
    const injector = createInjector(document);
    const assets = [
      createTestAsset({ id: '1', kind: 'css', code: '.edit{}', screens: ['edit'] }),
      createTestAsset({ id: '2', kind: 'css', code: '.all{}' }),
    ];
    injector.sync(assets, 'detail');
    injector.sync(assets, 'edit');
    expect(head.map((style) => style.textContent)).toEqual(['.edit{}', '.all{}']);
    expect(head.map((style) => style.disabled)).toEqual([false, false]);
  });

  test('一覧から外れたアセットの style は取り除く(パネルで無効にしたとき)', () => {
    const { document, head } = createFakeDocument();
    const injector = createInjector(document);
    const a = createTestAsset({ id: '1', kind: 'css', code: '.a{}' });
    const b = createTestAsset({ id: '2', kind: 'css', code: '.b{}' });
    injector.sync([a, b], 'detail');
    injector.sync([b], 'detail');
    expect(head.map((style) => style.textContent)).toEqual(['.b{}']);
  });

  test('後から加わったアセットも、実行順の位置へ入れる(パネルで有効にしたとき)', () => {
    const { document, head } = createFakeDocument();
    const injector = createInjector(document);
    const a = createTestAsset({ id: '1', kind: 'css', code: '.a{}' });
    const b = createTestAsset({ id: '2', kind: 'css', code: '.b{}' });
    injector.sync([b], 'detail');
    injector.sync([a, b], 'detail');
    expect(head.map((style) => style.textContent)).toEqual(['.a{}', '.b{}']);
  });

  test('コードが変わったアセットは、style の中身を差し替える', () => {
    const { document, head } = createFakeDocument();
    const injector = createInjector(document);
    injector.sync([createTestAsset({ id: '1', kind: 'css', code: '.a{}' })], 'detail');
    injector.sync([createTestAsset({ id: '1', kind: 'css', code: '.changed{}' })], 'detail');
    expect(head.map((style) => style.textContent)).toEqual(['.changed{}']);
  });
});

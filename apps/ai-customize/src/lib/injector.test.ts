import { describe, expect, test } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import { createInjector, type DocumentLike, type StyleLike } from './injector';

type FakeStyle = StyleLike & { attributes: Record<string, string> };

const createFakeDocument = () => {
  const head: FakeStyle[] = [];
  const document: DocumentLike = {
    createElement: () => {
      const style: FakeStyle = {
        textContent: null,
        disabled: false,
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
      };
      return style;
    },
    head: { appendChild: (node) => head.push(node as FakeStyle) },
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
    expect(head[1]!.attributes).toEqual({
      'data-ai-customize-id': '5',
      'data-ai-customize-scope': 'private',
    });
  });

  test('画面が変わったら、適用画面外の style を無効にし、戻れば有効にする', () => {
    const { document, head } = createFakeDocument();
    const injector = createInjector(document);
    const assets = [createTestAsset({ id: '1', kind: 'css', code: '.a{}', screens: ['detail'] })];
    injector.sync(assets, 'detail');
    expect(head[0]!.disabled).toBe(false);
    injector.sync(assets, 'edit');
    expect(head[0]!.disabled).toBe(true);
    injector.sync(assets, 'detail');
    expect(head[0]!.disabled).toBe(false);
    expect(head).toHaveLength(1);
  });

  test('適用画面外なら、その画面では style を作らない', () => {
    const { document, head } = createFakeDocument();
    createInjector(document).sync(
      [createTestAsset({ kind: 'css', code: '.a{}', screens: ['edit'] })],
      'detail'
    );
    expect(head).toHaveLength(0);
  });
});

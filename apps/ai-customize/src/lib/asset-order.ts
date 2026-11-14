import type { Asset } from '@/schema/asset';
import type { AssetAccess } from './asset-access';

/**
 * ドラッグでの並べ替えと、実行順の採番(純粋関数)
 *
 * 先頭から`100, 200, 300, …`と振り直す。隙間採番は結局破綻するため、歯抜けを残さない。
 * 保存するのは値が変わったレコードだけ。
 *
 * @see docs/06-ui.md 5章「実行順の並び替え(ドラッグ&ドロップ)」
 */

export const ORDER_STEP = 100;

/** 配列の要素を移動した新しい配列を返します。範囲外なら同じ並びのコピー */
export const moveItem = <T>(items: readonly T[], from: number, to: number): T[] => {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) {
    return next;
  }
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
};

export type OrderUpdate = { id: string; revision: string; order: number };

/** 並べ替えた後の一覧から、実行順を書き換えるレコードを返します */
export const planOrderUpdates = (
  assets: readonly Pick<Asset, 'id' | 'revision' | 'order'>[]
): OrderUpdate[] =>
  assets.flatMap((asset, index) => {
    const order = (index + 1) * ORDER_STEP;
    return asset.order === order ? [] : [{ id: asset.id, revision: asset.revision, order }];
  });

/**
 * 一覧を並べ替えられるか
 *
 * 振り直しで一覧のどのレコードも書き換わりうるため、1件でも実行順を編集できないレコードがあれば並べ替えさせない
 */
export const canReorderAll = (accesses: readonly Pick<AssetAccess, 'canReorder'>[]): boolean =>
  accesses.length > 1 && accesses.every((access) => access.canReorder);

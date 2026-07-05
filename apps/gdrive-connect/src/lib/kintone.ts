import type { kintoneAPI } from '@konomi-app/kintone-utilities';

/**
 * フォームレイアウトを平坦化し、フィールドの配列に変換します
 *
 * グループ内のフィールドも再帰的に展開します
 */
export const flatLayout = (layout: kintoneAPI.Layout): kintoneAPI.LayoutField[] => {
  return layout.flatMap((item: kintoneAPI.Layout[number]) => {
    switch (item.type) {
      case 'GROUP':
        return flatLayout(item.layout);
      case 'ROW':
      case 'SUBTABLE':
        return item.fields;
      default:
        return [];
    }
  });
};

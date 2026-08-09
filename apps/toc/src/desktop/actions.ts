import { getSpaceElement } from '@konomi-app/kintone-utilities';
import invariant from 'tiny-invariant';

export function onTocItemClick(event: MouseEvent) {
  invariant(event.target, 'イベントターゲットが存在しません');

  const spaceId = (event.target as HTMLLIElement).dataset.spaceId;
  invariant(spaceId, 'スペースIDが取得できませんでした');

  const spaceElement = getSpaceElement(spaceId);
  invariant(spaceElement, 'スペースが見つかりませんでした');

  const headerHeight = 140;
  const spaceTop = spaceElement.getBoundingClientRect().top;
  const scrollY = window.scrollY;
  window.scrollTo({
    top: scrollY + spaceTop - headerHeight,
    behavior: 'smooth',
  });
}

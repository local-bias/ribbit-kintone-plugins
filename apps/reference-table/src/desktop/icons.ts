const createSvgElement = <K extends keyof SVGElementTagNameMap>(tagName: K) => {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
};

const createIconElement = (pathData: string) => {
  const svg = createSvgElement('svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path = createSvgElement('path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', pathData);
  svg.append(path);

  return svg;
};

export const createDocumentIconElement = () => {
  return createIconElement(
    'M10 2v4.5A1.5 1.5 0 0 0 11.5 8H16v8.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16.5v-13A1.5 1.5 0 0 1 5.5 2zm1 .25V6.5a.5.5 0 0 0 .5.5h4.25z'
  );
};

export const createFilterIconElement = () => {
  return createIconElement(
    'M3.25 4.5A1.25 1.25 0 0 1 4.5 3.25h11a1.25 1.25 0 0 1 .9 2.118l-4.15 4.302v4.58a.75.75 0 0 1-.36.64l-3 1.83a.75.75 0 0 1-1.14-.64V9.67L3.6 5.368A1.25 1.25 0 0 1 3.25 4.5Zm1.28.25 4.01 4.157a.75.75 0 0 1 .21.52v5.317l1.5-.915V9.427a.75.75 0 0 1 .21-.52l4.01-4.157z'
  );
};

/** 昇順ソートアイコン（上向き矢印） */
export const createSortAscIconElement = () => {
  return createIconElement('M10 2l2.5 3h-1.75V18h-1.5V5H7.5z');
};

/** 降順ソートアイコン（下向き矢印） */
export const createSortDescIconElement = () => {
  return createIconElement('M10 18l2.5-3h-1.75V2h-1.5v13H7.5z');
};

/** ソートなしアイコン（上下矢印） */
export const createSortNoneIconElement = () => {
  return createIconElement('M10 2l2.5 3h-1.75V9h-1.5V5H7.5z M10 18l2.5-3h-1.75V11h-1.5v4H7.5z');
};

/** ダウンロードアイコン（下矢印 + 下線） */
export const createDownloadIconElement = () => {
  return createIconElement(
    'M10 13.25a.75.75 0 0 1-.53-.22L6.22 9.78a.75.75 0 0 1 1.06-1.06L9.25 10.69V3.5a.75.75 0 0 1 1.5 0v7.19l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-.53.22zM4.75 16.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H4.75z'
  );
};

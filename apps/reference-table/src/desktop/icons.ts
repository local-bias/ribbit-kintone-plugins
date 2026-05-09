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

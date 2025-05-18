import { manager } from '@/lib/event-manager';
import { getAppId, getAppSettings, getHeaderSpace } from '@konomi-app/kintone-utilities';
import { createRoot } from 'react-dom/client';
import App from './app';

const ROOT_ID = 'ribbit-kintone-plugin-theme-root';

manager.add(['app.record.index.show'], async (event) => {
  if (document.getElementById(ROOT_ID)) {
    return event;
  }

  const headerSpace = getHeaderSpace(event.type);
  if (!headerSpace) {
    console.warn('No header space found');
    return event;
  }

  const rootElement = document.createElement('span');
  rootElement.id = ROOT_ID;
  rootElement.style.display = 'inline-flex';
  rootElement.style.padding = '0 4px';
  headerSpace.append(rootElement);

  const root = createRoot(rootElement);

  const response = await getAppSettings({ app: getAppId()! });

  root.render(<App initSettings={response} />);

  return event;
});

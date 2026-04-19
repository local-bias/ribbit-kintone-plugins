import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { getAllApps, getAppId, getFormLayout, kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { eagerAtom } from 'jotai-eager';

export const currentAppFieldsAtom = atom((get) => {
  const app = get(currentAppIdAtom);
  return get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

/**
 * ユーザーがアクセス可能な全てのアプリの情報を取得するAtom
 */
export const kintoneAppsAtom = atom(() => {
  return getAllApps({ guestSpaceId: GUEST_SPACE_ID, debug: isDev });
});

/**
 * 指定されたアプリIDに対応するアプリ情報を取得するAtom
 *
 * @param appId アプリID
 * @returns アプリ情報
 */
export const kintoneAppAtom = atomFamily(
  (appId: string | number) =>
    eagerAtom((get) => {
      const apps = get(kintoneAppsAtom);
      return apps.find((app) => app.appId === appId);
    }),
  (a, b) => a == b
);

export const flatLayout = (layout: kintoneAPI.Layout): kintoneAPI.LayoutField[] => {
  const results: kintoneAPI.LayoutField[] = [];
  for (const chunk of layout) {
    if (chunk.type === 'ROW') {
      results.push(...flatLayoutRow(chunk));
      continue;
    } else if (chunk.type === 'GROUP') {
      results.push(...flatLayout(chunk.layout));
    } else if (chunk.type === 'SUBTABLE') {
      results.push(...chunk.fields);
    }
  }
  return results;
};

export const flatLayoutRow = (row: kintoneAPI.layout.Row): kintoneAPI.LayoutField[] => {
  return row.fields.reduce<kintoneAPI.LayoutField[]>((acc, field) => [...acc, field], []);
};

export const appLayoutAtom = atom<Promise<kintoneAPI.Layout>>(async () => {
  const app = getAppId();
  if (!app) {
    throw new Error('アプリのフィールド情報が取得できませんでした');
  }

  const { layout } = await getFormLayout({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });
  return layout;
});

export const appLabelsAtom = atom<Promise<string[]>>(async (get) => {
  const layout = await get(appLayoutAtom);

  const fields = flatLayout(layout);

  const labels = fields.filter((field) => field.type === 'LABEL') as kintoneAPI.layout.Label[];

  const parser = new DOMParser();

  const texts = labels
    .map(({ label }) => {
      const doc = parser.parseFromString(label, 'text/html');
      return doc.body.textContent;
    })
    .filter((text) => !!text);

  return texts as string[];
});

export const appSpacesState = atom<Promise<kintoneAPI.layout.Spacer[]>>(async (get) => {
  const layout = await get(appLayoutAtom);

  const fields = flatLayout(layout);

  const spaces = fields.filter((field) => field.type === 'SPACER') as kintoneAPI.layout.Spacer[];

  const filtered = spaces.filter((space) => space.elementId);

  return filtered;
});

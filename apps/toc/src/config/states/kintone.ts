import { atom } from 'jotai';
import { eagerAtom } from 'jotai-eager';
import { flatLayout, getUserDefinedFields } from '@/lib/kintone-api';
import { getFormLayout, kintoneAPI } from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID } from '@/lib/global';
import { getAppId } from '@lb-ribbit/kintone-xapp';

export const appFieldsAtom = atom(async () => {
  const properties = await getUserDefinedFields({ preview: true, guestSpaceId: GUEST_SPACE_ID });

  const values = Object.values(properties);

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

export const appLayoutAtom = atom(async () => {
  const app = getAppId();
  if (!app) {
    throw new Error('アプリのフィールド情報が取得できませんでした');
  }

  const { layout } = await getFormLayout({ app, preview: true, guestSpaceId: GUEST_SPACE_ID });
  return layout;
});

export const appSpacesAtom = eagerAtom((get) => {
  const layout = get(appLayoutAtom);

  const fields = flatLayout(layout);

  const spaces = fields.filter((field) => field.type === 'SPACER') as kintoneAPI.layout.Spacer[];

  const filtered = spaces.filter((space) => space.elementId);

  return filtered;
});

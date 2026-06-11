import { JotaiAppSelect } from '@konomi-app/kintone-utilities-jotai';
import { Skeleton } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { type FC, Suspense } from 'react';
import { dstAppIdAtom, dstSpaceIdAtom, isDstAppGuestSpaceAtom } from '@/config/states/plugin';
import { kintoneAppsState, kintoneSpacesState } from '../../../states/kintone';

const Component: FC = () => {
  const allApps = useAtomValue(kintoneAppsState);
  const dstAppId = useAtomValue(dstAppIdAtom);
  const setDstAppId = useSetAtom(dstAppIdAtom);
  const spaces = useAtomValue(kintoneSpacesState);
  const setDstSpaceId = useSetAtom(dstSpaceIdAtom);
  const setIsDstAppGuestSpace = useSetAtom(isDstAppGuestSpaceAtom);

  const onAppChange = (value: string) => {
    setDstAppId(value);

    const dstApp = allApps.find((app) => app.appId === value);
    if (!dstApp) {
      return;
    }

    const dstSpace = spaces.find((space) => space.id === dstApp.spaceId);
    if (!dstSpace) {
      return;
    }
    setDstSpaceId(dstSpace.id ?? null);
    setIsDstAppGuestSpace(dstSpace.isGuest);
  };

  return <JotaiAppSelect appId={dstAppId} appsAtom={kintoneAppsState} onChange={onAppChange} />;
};

const Container: FC = () => {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
      <Component />
    </Suspense>
  );
};

export default Container;

import React, { FC } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { RecoilAppSelect } from '@konomi-app/kintone-utilities-react';
import { allAppsState } from '../../../states/kintone';
import { getConditionPropertyState } from '../../../states/plugin';
import { t } from '@/lib/i18n';

const state = getConditionPropertyState('srcAppId');

const Component: FC = () => {
  const appId = useRecoilValue(state);

  const onChange = useRecoilCallback(
    ({ set }) =>
      (code: string) => {
        set(state, code);
      },
    []
  );

  return (
    <RecoilAppSelect
      appsState={allAppsState}
      onChange={onChange}
      appId={appId}
      label={t('config.condition.srcAppId.label')}
    />
  );
};

export default Component;

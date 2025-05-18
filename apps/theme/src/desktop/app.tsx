import { GUEST_SPACE_ID } from '@/lib/global';
import styled from '@emotion/styled';
import { getAppSettings, kintoneAPI } from '@konomi-app/kintone-utilities';
import { getAppId } from '@lb-ribbit/kintone-xapp';
import { CircularProgress, MenuItem, TextField } from '@mui/material';
import React, { ChangeEventHandler, FC } from 'react';

type Props = { initSettings: kintoneAPI.AppSettings; className?: string };

type Theme = kintoneAPI.AppSettings['theme'];

const THEMES = [
  ['WHITE', 'gaia-argoui-app-theme-white', 'ホワイト'],
  ['RED', 'gaia-argoui-app-theme-red', 'レッド'],
  ['BLUE', 'gaia-argoui-app-theme-blue', 'ブルー'],
  ['GREEN', 'gaia-argoui-app-theme-green', 'グリーン'],
  ['YELLOW', 'gaia-argoui-app-theme-yellow', 'イエロー'],
  ['BLACK', 'gaia-argoui-app-theme-black', 'ブラック'],
] as const satisfies [Theme, string, string][];

const TARGET_SELECTOR = '.container-gaia';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getThemeClassName(src: Theme) {
  for (const theme of THEMES) {
    if (theme[0] === src) {
      return theme[1];
    }
  }
  return '';
}

const Component: FC<Props> = ({ className, initSettings }) => {
  const [loading, setLoading] = React.useState(false);
  const [theme, setTheme] = React.useState(initSettings.theme || THEMES[0][0]);
  const timer = React.useRef(setTimeout(() => {}, 0));

  React.useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const selectedTheme = event.target.value as Theme;

    if (loading) {
      return;
    }
    setLoading(true);
    setTheme(selectedTheme);

    const app = getAppId()!;

    const origin = await getAppSettings({
      app,
      preview: true,
      guestSpaceId: GUEST_SPACE_ID,
    });

    const originClass = getThemeClassName(origin.theme);

    const response = await kintone.api(kintone.api.url('/k/v1/preview/app/settings', true), 'PUT', {
      app,
      theme: event.target.value,
    });

    const dstClass = getThemeClassName(selectedTheme);
    const target = document.querySelector(TARGET_SELECTOR);

    if (!target) {
      throw 'error';
    }

    target.classList.remove(originClass);
    target.classList.add(dstClass);

    // 変更をアプリ設定に適用
    await kintone.api(kintone.api.url('/k/v1/preview/app/deploy', true), 'POST', {
      apps: [{ app, revision: response.revision }],
    });

    // 設定変更の完了には時間がかかる場合があるので、一定間隔で確認します
    let deployed = false;
    while (!deployed) {
      await sleep(500);

      const deployResponse = await kintone.api(
        kintone.api.url('/k/v1/preview/app/deploy', true),
        'GET',
        {
          apps: [app],
        }
      );

      deployed = deployResponse.apps[0].status === 'SUCCESS';
    }

    // 読込通知を終了
    setLoading(false);
  };

  return (
    <div className={className}>
      <TextField
        label='テーマの変更'
        select
        value={theme}
        disabled={loading}
        onChange={handleChange}
        className='select'
      >
        {THEMES.map((theme) => (
          <MenuItem key={theme[0]} value={theme[0]}>
            {theme[2]}
          </MenuItem>
        ))}
      </TextField>
      {loading && <CircularProgress size={24} className='button-progress' />}
    </div>
  );
};

const StyledComponent = styled(Component)`
  position: relative;

  .select {
    min-width: 120px;
  }
  .button-progress {
    color: #4caf50;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -12px;
    margin-left: -12px;
  }
`;

export default StyledComponent;

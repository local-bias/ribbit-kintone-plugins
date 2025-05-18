import { GUEST_SPACE_ID } from '@/lib/global';
import styled from '@emotion/styled';
import { getAppSettings, kintoneAPI } from '@konomi-app/kintone-utilities';
import { getAppId } from '@lb-ribbit/kintone-xapp';
import { CircularProgress, Menu, MenuItem } from '@mui/material';
import { Paintbrush } from 'lucide-react';
import React, { FC } from 'react';

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

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  React.useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const handleChange = async (selectedTheme: Theme) => {
    setAnchorEl(null);

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
      theme: selectedTheme,
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
    <>
      <div className={className} onClick={handleClick} title='テーマカラーを変更'>
        {loading ? (
          <CircularProgress size={24} className='button-progress' />
        ) : (
          <Paintbrush className='🐸theme' />
        )}
      </div>
      <Menu
        id='basic-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {THEMES.map((theme) => (
          <MenuItem key={theme[0]} value={theme[0]} onClick={() => handleChange(theme[0])}>
            {theme[2]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const StyledComponent = styled(Component)`
  position: relative;

  box-sizing: border-box;
  width: 48px;
  height: 48px;
  border: 1px solid #e3e7e8;
  background-color: #f7f9fa;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  &:hover {
    .🐸theme {
      color: var(--🐸primary);
    }
  }

  .🐸theme {
    color: #a8a8a8;
    width: 30px;
    height: 30px;
    transition: color 0.2s ease-in-out;
  }
`;

export default StyledComponent;

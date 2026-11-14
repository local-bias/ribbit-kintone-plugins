import { createTheme } from '@mui/material';

/**
 * ランチャーのMUIテーマ
 *
 * 設定画面と同じブランド色(`@repo/plugin`の`getMUITheme`)。`@repo/plugin/react`を操作画面で読み込むと、
 * 設定画面用の部品(`@konomi-app/kintone-utilities-react`)までバンドルに入りうるため、ここに小さく持つ
 */
export const launcherTheme = createTheme({
  palette: { primary: { main: '#3498db' } },
  typography: { fontSize: 13 },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: false } },
  },
});

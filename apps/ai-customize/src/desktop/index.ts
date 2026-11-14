import '@/lib/global';
import { bootstrap } from './bootstrap';
import { startLauncher } from './launcher/mount';

// 本プラグインの起動処理の不具合で、kintoneの画面表示を止めない。
// ランチャーの描画に失敗しても、アセットの実行(起動ゲート)は止めない
let publish = () => {};
try {
  const result = bootstrap({ onChange: () => publish() });
  if (result !== null) {
    try {
      publish = startLauncher(result);
    } catch (error) {
      console.error('[ai-customize]', error);
    }
  }
} catch (error) {
  console.error('[ai-customize]', error);
}

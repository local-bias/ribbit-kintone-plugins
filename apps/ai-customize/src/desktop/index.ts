import '@/lib/global';
import { bootstrap } from './bootstrap';

// 本プラグインの起動処理の不具合で、kintoneの画面表示を止めない
try {
  bootstrap();
} catch (error) {
  console.error('[ai-customize]', error);
}

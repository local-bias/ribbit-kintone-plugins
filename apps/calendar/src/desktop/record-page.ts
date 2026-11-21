/**
 * 詳細編集モードでkintone標準のレコード追加・編集画面をiframeダイアログに埋め込んだ際、
 * 保存・キャンセルをkintoneの標準イベントで検知し、`window.parent`へpostMessageする。
 *
 * `KintoneEventManager#add`はデスクトップ版のイベントを登録すると、対応する`mobile.*`
 * イベントも自動的に登録する。モバイル版の詳細編集も同じ仕組みで動作するため、PC版・
 * モバイル版のどちらのイベントも同様に扱う。
 *
 * ダイアログ内かどうかは、URLの判定用パラメータに加えてiframeの`name`でも判定する
 * (`isInlineEditFrame`を参照)。ページの再読み込みを伴う遷移の後もキャンセルを検知するため。
 */
import { listener } from '@/lib/listener';
import {
  applyInlineCreateInitialValues,
  isInlineCreateFrame,
  isInlineCreatePage,
  isInlineEditFrame,
  isInlineEditPage,
  postInlineCreateCancelled,
  postInlineCreateSubmitSuccess,
  postInlineEditCancelled,
  postInlineEditSubmitSuccess,
  shouldTreatDetailShowAsEditCancel,
} from './inline-record';
import './record-page-recurrence';

/** このドキュメントで編集画面が表示されたかどうか。モバイル版では編集画面を開く過程で
 *  詳細画面の表示イベントが先に発火する可能性があり、それを誤ってキャンセル扱いにしないため */
let hasShownEditScreen = false;

if (isInlineEditFrame()) {
  listener.add(['app.record.edit.show'], (event) => {
    hasShownEditScreen = true;
    return event;
  });

  listener.add(['app.record.edit.submit.success'], (event) => {
    postInlineEditSubmitSuccess(String(event.recordId));
    return event;
  });

  // キャンセル時はkintoneが詳細(閲覧)画面へ遷移するため、そのタイミングで検知する
  listener.add(['app.record.detail.show'], (event) => {
    if (
      shouldTreatDetailShowAsEditCancel({
        hasShownEditScreen,
        isOnInitialInlineUrl: isInlineEditPage(),
      })
    ) {
      postInlineEditCancelled();
    }
    return event;
  });

  // 一覧画面へ遷移した場合も編集画面を離れたものとみなす(iframe内でカレンダーが描画されたまま
  // 残らないようにする)
  listener.add(['app.record.index.show'], (event) => {
    postInlineEditCancelled();
    return event;
  });
}

if (isInlineCreateFrame()) {
  listener.add(['app.record.create.show'], (event) => applyInlineCreateInitialValues(event));

  listener.add(['app.record.create.submit.success'], (event) => {
    postInlineCreateSubmitSuccess(String(event.recordId));
    return event;
  });

  // キャンセル等で一覧画面へ遷移した場合は、追加をやめたものとみなす
  listener.add(['app.record.index.show'], (event) => {
    if (!isInlineCreatePage()) {
      postInlineCreateCancelled();
    }
    return event;
  });
}

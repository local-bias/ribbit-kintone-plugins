import { listener } from '@/lib/listener';
import {
  applyInlineCreateInitialValues,
  isInlineCreatePage,
  isInlineEditPage,
  postInlineCreateSubmitSuccess,
  postInlineEditCancelled,
  postInlineEditSubmitSuccess,
} from './inline-record';
import './record-page-recurrence';

/**
 * 詳細編集モードでkintone標準のレコード追加・編集画面をiframeダイアログに埋め込んだ際、
 * 保存・キャンセルをkintoneの標準イベントで検知し、`window.parent`へpostMessageする。
 *
 * `KintoneEventManager#add`はデスクトップ版のイベントを登録すると自動的に対応する
 * `mobile.*`イベントも登録するが、詳細編集のiframeはデスクトップ限定(v1の既知の制限)のため、
 * mobileイベントはここでは無視する。
 */
const isMobileEvent = (type: string): boolean => type.startsWith('mobile.');

if (isInlineEditPage()) {
  listener.add(['app.record.edit.submit.success'], (event) => {
    if (!isMobileEvent(event.type)) {
      postInlineEditSubmitSuccess(String(event.recordId));
    }
    return event;
  });

  // キャンセル時はkintoneが詳細(閲覧)画面へ遷移するため、そのタイミングで検知する
  listener.add(['app.record.detail.show'], (event) => {
    if (!isMobileEvent(event.type)) {
      postInlineEditCancelled();
    }
    return event;
  });
}

if (isInlineCreatePage()) {
  listener.add(['app.record.create.show'], (event) => {
    if (isMobileEvent(event.type)) {
      return event;
    }
    return applyInlineCreateInitialValues(event);
  });

  listener.add(['app.record.create.submit.success'], (event) => {
    if (!isMobileEvent(event.type)) {
      postInlineCreateSubmitSuccess(String(event.recordId));
    }
    return event;
  });
}

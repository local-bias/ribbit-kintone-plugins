import { DEFAULT_RECURRENCE_FORM, RecurrenceFormInputs } from '@/desktop/components/recurrence-form';
import { calendarDateInputToDateTime, getLoginUserTimezone } from '@/desktop/date-conversion';
import {
  buildRRuleString,
  parseRecurrenceMeta,
  parseRRuleString,
  RecurrenceMeta,
  RecurrenceFormState,
  serializeRecurrenceMeta,
} from '@/desktop/recurrence';
import { listener } from '@/lib/listener';
import { t } from '@/lib/i18n-plugin';
import { restorePluginConfig } from '@/lib/plugin';
import type { PluginCondition } from '@/schema/plugin-config';
import {
  getCurrentRecord,
  getHeaderSpace,
  getMetaFieldId_UNSTABLE,
  setCurrentRecord,
  setFieldShown,
} from '@konomi-app/kintone-utilities';
import { FormControlLabel, Switch } from '@mui/material';
import { DateTime } from 'luxon';
import { FC, useState } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * 詳細編集モード(`editMode: 'detailed'`)で繰り返し予定が有効な場合、レコード追加・編集画面上の
 * 繰り返しJSONフィールドの入力コントロールを、プラグイン独自の繰り返し設定UIに置き換える。
 *
 * `getMetaFieldId_UNSTABLE(fieldCode)`で取得したメタフィールドIDから`.value-{id}`要素を
 * 取得する。これはフィールドのラベルを含まない値/コントロール領域そのものであることを
 * 確認済み(kintoneのDOMは`.row-gaia` > `.control-label-gaia`(ラベル) +
 * `.control-value-gaia`/`.control-gaia`(値)が兄弟要素として並ぶ構造で、`.value-{id}`は
 * 後者に対応する)。そのため、この要素の子(ネイティブの入力欄)を非表示にしたうえで自前の
 * UIをこの要素の子として追加すれば、ラベルの位置・文言はkintoneのフィールド設定のまま、
 * 値の部分だけを差し替えられる。`getMetaFieldId_UNSTABLE`は名前の通り非公開/不安定な
 * APIのため、`@konomi-app/kintone-utilities`の更新時はこの経路の動作を確認すること。
 *
 * フィールド要素が取得できない画面(将来のkintone側の変更等)に備え、取得できない場合は
 * 従来通りヘッダー領域(`getHeaderSpace`)へのフォールバックマウント + `setFieldShown(false)`を行う。
 * それも失敗する場合は、編集不能な非表示フィールドを残さないようフィールドを再表示する。
 *
 * 一覧からのインライン編集(`app.record.index.edit.show`)には非対応(v1の既知の制限。
 * 生フィールドが表示されたままになる)。
 *
 * マウント先の要素はレコードごと(=`show`イベントごと)に新しいDOM要素として払い出されるため、
 * Reactのrootをフィールドコード単位でキャッシュして使い回すと、前のレコードの(既に
 * デタッチされた)コンテナに向けて描画され続けてしまい、2件目以降のレコードで繰り返しUIが
 * 表示されなくなる(それでいてネイティブフィールドは非表示のまま、というバグを引き起こす)。
 * そのため`show`イベントのたびに必ず新しいrootを作成する。
 */

const CONTAINER_ATTR = 'data-ribbit-calendar-recurrence';

/** submit時に最終的な開始日でRRULEを再構築するため、ユーザーが実際に操作したフィールドの
 *  最新フォーム状態のみを保持する(未操作のフィールドは既存値をそのまま提出させる)。
 *  `show`イベントのたびにリセットすることで、前のレコードで操作した状態が別レコードの
 *  submitに漏れ出さないようにする。 */
const latestFormState = new Map<string, RecurrenceFormState | null>();

const isMobileEvent = (type: string): boolean => type.startsWith('mobile.');

/** 詳細編集 + 繰り返し有効 + 繰り返しフィールド設定ありのconditionを、
 *  フィールドコードの重複を除いて返す(複数conditionが同じフィールドを共有する場合の対策) */
const getTargetConditions = (): PluginCondition[] => {
  const config = restorePluginConfig();
  const seen = new Set<string>();
  return config.conditions.filter((condition) => {
    const fieldCode = condition.calendarEvent.recurrenceField;
    if (condition.editMode !== 'detailed' || !condition.enablesRecurrence || !fieldCode) {
      return false;
    }
    if (seen.has(fieldCode)) {
      return false;
    }
    seen.add(fieldCode);
    return true;
  });
};

const buildRecurrenceFieldValue = (params: {
  form: RecurrenceFormState | null;
  startValue: string | undefined;
  existing: RecurrenceMeta | null;
}): string => {
  const { form, startValue, existing } = params;
  if (!form) return '';

  // kintoneのDATETIMEフィールドの生値はUTCのISO文字列(実時刻)なので、ログインユーザーの
  // タイムゾーンへ明示的にアンカーしてから`.day`/`.weekday`等を参照する必要がある。
  // ブラウザの実タイムゾーン(デフォルトのDateTime解釈先)に任せると、ログインユーザーの
  // 設定タイムゾーンと異なる地域からアクセスした際に日付がずれる(dialog/inputs/recurrence.tsx
  // の`calendarDateInputToDateTime`と同じ理由)。
  const zone = getLoginUserTimezone();
  const startDt = startValue ? calendarDateInputToDateTime(startValue, zone) : DateTime.now().setZone(zone);
  const exceptions = existing?.kind === 'master' ? existing.exceptions : [];
  return serializeRecurrenceMeta({ kind: 'master', rrule: buildRRuleString(form, startDt), exceptions });
};

interface RecurrenceFieldEditorProps {
  condition: PluginCondition;
  fieldCode: string;
  initialMeta: RecurrenceMeta | null;
}

const RecurrenceFieldEditor: FC<RecurrenceFieldEditorProps> = ({ condition, fieldCode, initialMeta }) => {
  const [form, setForm] = useState<RecurrenceFormState | null>(
    initialMeta?.kind === 'master' ? parseRRuleString(initialMeta.rrule) : null
  );

  if (initialMeta?.kind === 'override') {
    return (
      <div className='p-3 text-sm text-foreground/70'>{t('desktop.recurrenceField.overrideNotice')}</div>
    );
  }

  const syncToRecord = (nextForm: RecurrenceFormState | null) => {
    latestFormState.set(fieldCode, nextForm);

    const { record } = getCurrentRecord();
    const startValue = record[condition.calendarEvent.startField]?.value as string | undefined;
    const existing = parseRecurrenceMeta(record[fieldCode]?.value as string | undefined);

    setCurrentRecord({
      record: {
        ...record,
        [fieldCode]: {
          ...record[fieldCode],
          value: buildRecurrenceFieldValue({ form: nextForm, startValue, existing }),
        },
      },
    });
  };

  return (
    <div className='p-3 grid gap-2'>
      <div className='font-bold text-sm'>{t('desktop.recurrenceField.label')}</div>
      <FormControlLabel
        control={
          <Switch
            checked={form !== null}
            onChange={(_, checked) => {
              const next = checked ? DEFAULT_RECURRENCE_FORM : null;
              setForm(next);
              syncToRecord(next);
            }}
          />
        }
        label={t('desktop.dialog.recurrence.enable')}
      />
      {form && (
        <RecurrenceFormInputs
          form={form}
          onChange={(updater) => {
            setForm((current) => {
              const next = updater(current ?? DEFAULT_RECURRENCE_FORM);
              syncToRecord(next);
              return next;
            });
          }}
        />
      )}
    </div>
  );
};

/** `parent`の子のうち、自前のマウントコンテナ以外(=ネイティブの入力コントロール)を非表示にする */
const hideNativeControlChildren = (parent: HTMLElement): void => {
  Array.from(parent.children).forEach((child) => {
    if (child instanceof HTMLElement && !child.hasAttribute(CONTAINER_ATTR)) {
      child.style.display = 'none';
    }
  });
};

/** `parent`内の既存マウントコンテナを除去し、新しいコンテナを追加して返す */
const createMountContainer = (parent: HTMLElement, fieldCode: string): HTMLElement => {
  parent.querySelector(`[${CONTAINER_ATTR}]`)?.remove();
  const container = document.createElement('div');
  container.setAttribute(CONTAINER_ATTR, fieldCode);
  // プラグイン共通のTailwindリセット(border/box-sizing/見出し・リストのmargin等)を適用する。
  // kintoneのフォームDOM内に直接マウントされるため、このスコープが無いとレイアウトが崩れる。
  container.classList.add('🐸');
  parent.append(container);
  return container;
};

const renderRecurrenceEditor = (params: {
  container: HTMLElement;
  condition: PluginCondition;
  fieldCode: string;
  initialMeta: RecurrenceMeta | null;
}): void => {
  const { container, condition, fieldCode, initialMeta } = params;
  createRoot(container).render(
    <RecurrenceFieldEditor condition={condition} fieldCode={fieldCode} initialMeta={initialMeta} />
  );
};

listener.add(['app.record.create.show', 'app.record.edit.show'], (event) => {
  for (const condition of getTargetConditions()) {
    const fieldCode = condition.calendarEvent.recurrenceField;
    // 新しいレコードの表示なので、前のレコードで操作したフォーム状態を持ち越さない
    latestFormState.delete(fieldCode);

    const initialMeta = parseRecurrenceMeta(event.record[fieldCode]?.value as string | undefined);

    // 優先: フィールド自身の値/コントロール領域を取得し、ネイティブ入力を隠して置き換える
    // (ラベルはこの要素に含まれないため、そのまま表示され続ける)
    const targetMetaField = getMetaFieldId_UNSTABLE(fieldCode);
    if (targetMetaField) {
      const fieldElement =
        document.querySelector<HTMLDivElement>(`.value-${targetMetaField} > div`) ||
        document.querySelector<HTMLDivElement>(`.value-${targetMetaField}`);
      if (fieldElement) {
        hideNativeControlChildren(fieldElement);
        const container = createMountContainer(fieldElement, fieldCode);
        renderRecurrenceEditor({ container, condition, fieldCode, initialMeta });
        continue;
      }
    }

    // フォールバック: フィールド要素が取得できない場合はフィールド全体を隠し、ヘッダー領域へ
    // カード状のUIとしてマウントする
    setFieldShown(fieldCode, false);
    const host = getHeaderSpace(event.type);
    if (!host) {
      // マウントできない場合は、編集不能な非表示フィールドを残さないよう再表示する
      setFieldShown(fieldCode, true);
      continue;
    }
    const container = createMountContainer(host, fieldCode);
    renderRecurrenceEditor({ container, condition, fieldCode, initialMeta });
  }

  return event;
});

listener.add(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
  if (isMobileEvent(event.type)) {
    return event;
  }

  for (const condition of getTargetConditions()) {
    const fieldCode = condition.calendarEvent.recurrenceField;
    if (!latestFormState.has(fieldCode)) {
      // ユーザーがこのセッションでUIを操作していない場合は、既存のフィールド値をそのまま提出する
      continue;
    }

    const field = event.record[fieldCode];
    if (!field) continue;

    const startValue = event.record[condition.calendarEvent.startField]?.value as string | undefined;
    const existing = parseRecurrenceMeta(field.value as string | undefined);
    field.value = buildRecurrenceFieldValue({
      form: latestFormState.get(fieldCode) ?? null,
      startValue,
      existing,
    });
  }

  return event;
});

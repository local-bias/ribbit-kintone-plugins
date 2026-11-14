import { commonUi, useTranslations } from '@repo/utils';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';

const ui = mergeDeep(commonUi, {
  ja: {
    'desktop.submitError':
      'カスタマイズの保存前処理でエラーが発生したため、保存を中止しました。管理者に連絡してください。',
    'desktop.notice.safeMode': 'セーフモードで表示しています(カスタマイズは適用されていません)',
    'desktop.notice.exitSafeMode': 'セーフモードを解除',
    'desktop.notice.timeout':
      'カスタマイズの読み込みが間に合いませんでした。保存前チェックなどのカスタマイズは動いていません。',
    'desktop.notice.reload': '再読み込み',
    'desktop.notice.loadFailed': 'カスタマイズを取得できませんでした({0})',
    'desktop.notice.tooMany':
      'カスタマイズが上限({0}件)を超えているため、1件も適用していません。管理アプリを整理してください。',
    'desktop.notice.tooLarge':
      'カスタマイズのコードの合計が上限を超えているため、1件も適用していません。管理アプリを整理してください。',
    'desktop.notice.problems':
      'カスタマイズ{0}件で問題が発生しました。詳細は開発者ツールのコンソールを確認してください。',
    'desktop.notice.openSafeMode': 'セーフモードで開く',
    'desktop.notice.dismiss': '閉じる',
    'desktop.denied': 'カスタマイズ#{0}の {1} は、許可されていないため止めました(必要な権限: {2})',
    'desktop.denied.external': '外部通信',
    'desktop.denied.writePermission': '追加・更新・削除のいずれか',
    'desktop.denied.never': 'このプラグインでは常に禁止',
    'desktop.log.unusableConfig':
      'プラグインの設定が完了していないため、カスタマイズを適用しません。',
    'desktop.log.skipped': 'カスタマイズ#{0}を実行対象から外しました({1})',
    'desktop.log.blocked.bypass':
      'カスタマイズ#{0}は、権限の制御を迂回できる書き方を含むため実行しませんでした。実行するには「制限なし」の権限が必要です。',
    'desktop.log.blocked.external':
      'CSSカスタマイズ#{0}は、許可されていない外部の送信先を参照しているため適用しませんでした。',
    'desktop.log.evaluationFailed': 'カスタマイズ#{0}の実行に失敗しました',
    'desktop.log.handlerFailed': 'カスタマイズ#{0}のイベント処理({1})でエラーが発生しました',
    'desktop.log.suspended':
      'カスタマイズ#{0}はエラーが続いたため、このタブでの実行を一時的に停止しました',
    'desktop.log.rejectedEvent': 'カスタマイズ#{0}が購読できないイベント({1})を指定しました',
    'desktop.log.ignoredThenable':
      'カスタマイズ#{0}が{1}でPromiseを返しました。このイベントはPromiseに対応していないため、待たずに続けます',
    'desktop.log.slowEvaluation': 'カスタマイズ#{0}の実行に{1}msかかりました',
    'desktop.log.timeout':
      'カスタマイズの読み込みが{0}ms以内に終わらなかったため、適用しませんでした',
    'desktop.log.internal': '起動処理で予期しないエラーが発生しました',

    'config.error.formLoadFailure': '情報を取得できませんでした。アクセス権を確認してください({0})',
    'config.assetApp.title': 'アセット管理アプリ',
    'config.assetApp.description':
      'JavaScript・CSSのカスタマイズを保存するkintoneアプリを選択します。1つの管理アプリで複数のアプリのカスタマイズを管理できます。',
    'config.assetApp.label': 'アセット管理アプリ',
    'config.assetApp.placeholder': 'アプリ名またはIDで検索',
    'config.assetApp.selfWarning':
      'このアプリ自身が選択されています。管理アプリにはこのプラグインを入れないでください(自分のカスタマイズで管理画面を壊せてしまいます)。',
    'config.assetApp.guestWarning':
      'ゲストスペースのアプリからは、同じゲストスペース内の管理アプリしか参照できません。',
    'config.fields.title': 'フィールドの対応付け',
    'config.fields.description':
      '管理アプリのフィールドを、プラグインが使う項目に対応付けます。表示されるのは、項目に合う種類のフィールドだけです。',
    'config.fields.selectAppFirst': '先にアセット管理アプリを選択してください。',
    'config.fields.required': '必須',
    'config.fields.optional': '任意',
    'config.fields.placeholder': 'フィールド名またはコードで検索',
    'config.fields.title.label': 'タイトル',
    'config.fields.targetAppId.label': '対象アプリID',
    'config.fields.targetSpaceId.label': '対象ゲストスペースID(通常スペースは0)',
    'config.fields.kind.label': '種別(JavaScript / CSS)',
    'config.fields.code.label': 'コード',
    'config.fields.scope.label': '影響範囲(自分だけ / 全員)',
    'config.fields.status.label': '状態(有効 / 無効)',
    'config.fields.owner.label': '所有者(作成者フィールド)',
    'config.fields.permissions.label': '権限',
    'config.fields.externalUrls.label': '通信先(外部通信を許可する送信先)',
    'config.fields.order.label': '実行順',
    'config.fields.screens.label': '適用画面',
    'config.fields.description.label': '説明',
    'config.values.title': '選択肢の値',
    'config.values.description':
      '対応付けたフィールドの選択肢のうち、どれがどの意味を持つかを選びます。',
    'config.values.missing': '選択肢にありません',
    'config.values.selectFieldFirst': '先にフィールドを対応付けてください',
    'config.values.kindJs': '種別: JavaScript',
    'config.values.kindCss': '種別: CSS',
    'config.values.scopePrivate': '影響範囲: 自分だけ',
    'config.values.scopePublic': '影響範囲: 全員',
    'config.values.statusEnabled': '状態: 有効',
    'config.values.statusDisabled': '状態: 無効',
    'config.values.screenIndex': '適用画面: 一覧',
    'config.values.screenDetail': '適用画面: 詳細',
    'config.values.screenCreate': '適用画面: 追加',
    'config.values.screenEdit': '適用画面: 編集',
    'config.values.permissionPost': '権限: 追加(POST)',
    'config.values.permissionPut': '権限: 更新(PUT)',
    'config.values.permissionDelete': '権限: 削除(DELETE)',
    'config.values.permissionExternalListed': '権限: 外部通信(指定先のみ)',
    'config.values.permissionExternalAll': '権限: 外部通信(すべて)',
    'config.values.permissionUnrestricted': '権限: 制限なし',
    'config.permissions.caution':
      '権限は、カスタマイズが宣言外の操作をうっかり行うことを止める安全装置です。悪意あるコードを止める仕組みではありません。公開(全員)できる人は、管理アプリのアクセス権で限定してください。',
    'config.permissions.defaultWarning':
      '「権限」フィールドの初期値で選択されている項目があります。初期値は全て未選択(読み取りのみ)にしてください。',
    'config.permissions.externalUrlsMissing':
      '「通信先」フィールドを対応付けていないため、「外部通信(指定先のみ)」は常に全て拒否されます。',
  },
  en: {
    'desktop.submitError':
      'Saving was canceled because an error occurred in a customization. Please contact your administrator.',
    'desktop.notice.safeMode': 'Safe mode: customizations are not applied',
    'desktop.notice.exitSafeMode': 'Exit safe mode',
    'desktop.notice.timeout':
      'Customizations did not load in time. Customizations such as pre-save checks are not running.',
    'desktop.notice.reload': 'Reload',
    'desktop.notice.loadFailed': 'Could not load customizations ({0})',
    'desktop.notice.tooMany':
      'No customizations were applied because there are more than {0}. Please clean up the management app.',
    'desktop.notice.tooLarge':
      'No customizations were applied because their total code size exceeds the limit. Please clean up the management app.',
    'desktop.notice.problems':
      'Problems occurred in {0} customization(s). See the developer tools console for details.',
    'desktop.notice.openSafeMode': 'Open in safe mode',
    'desktop.notice.dismiss': 'Close',
    'desktop.denied':
      'Customization #{0}: {1} was blocked because it is not permitted (required: {2})',
    'desktop.denied.external': 'external communication',
    'desktop.denied.writePermission': 'one of create, update or delete',
    'desktop.denied.never': 'always blocked by this plugin',
    'desktop.log.unusableConfig':
      'Customizations are not applied because the plugin settings are incomplete.',
    'desktop.log.skipped': 'Customization #{0} was excluded ({1})',
    'desktop.log.blocked.bypass':
      'Customization #{0} was not run because it contains code that can bypass permission controls. The "unrestricted" permission is required to run it.',
    'desktop.log.blocked.external':
      'CSS customization #{0} was not applied because it references external destinations that are not permitted.',
    'desktop.log.evaluationFailed': 'Customization #{0} failed to run',
    'desktop.log.handlerFailed':
      'An error occurred in the event handler ({1}) of customization #{0}',
    'desktop.log.suspended': 'Customization #{0} was suspended in this tab because it kept failing',
    'desktop.log.rejectedEvent': 'Customization #{0} subscribed to an unsupported event ({1})',
    'desktop.log.ignoredThenable':
      'Customization #{0} returned a Promise from {1}. This event does not support Promises, so it was not awaited',
    'desktop.log.slowEvaluation': 'Customization #{0} took {1}ms to run',
    'desktop.log.timeout': 'Customizations were not applied because loading took more than {0}ms',
    'desktop.log.internal': 'An unexpected error occurred during startup',

    'config.error.formLoadFailure':
      'Could not load the information. Check the access permissions ({0})',
    'config.assetApp.title': 'Asset management app',
    'config.assetApp.description':
      'Select the kintone app that stores JavaScript and CSS customizations. One management app can hold customizations for multiple apps.',
    'config.assetApp.label': 'Asset management app',
    'config.assetApp.placeholder': 'Search by app name or ID',
    'config.assetApp.selfWarning':
      'This app itself is selected. Do not add this plugin to the management app (its customizations could break the management screen).',
    'config.assetApp.guestWarning':
      'Apps in a guest space can only refer to a management app in the same guest space.',
    'config.fields.title': 'Field mapping',
    'config.fields.description':
      'Map fields of the management app to the items used by the plugin. Only fields of a suitable type are shown.',
    'config.fields.selectAppFirst': 'Select the asset management app first.',
    'config.fields.required': 'Required',
    'config.fields.optional': 'Optional',
    'config.fields.placeholder': 'Search by field name or code',
    'config.fields.title.label': 'Title',
    'config.fields.targetAppId.label': 'Target app ID',
    'config.fields.targetSpaceId.label': 'Target guest space ID (0 for regular spaces)',
    'config.fields.kind.label': 'Kind (JavaScript / CSS)',
    'config.fields.code.label': 'Code',
    'config.fields.scope.label': 'Scope (only me / everyone)',
    'config.fields.status.label': 'Status (enabled / disabled)',
    'config.fields.owner.label': 'Owner (Created by field)',
    'config.fields.permissions.label': 'Permissions',
    'config.fields.externalUrls.label': 'Destinations (allowed external destinations)',
    'config.fields.order.label': 'Execution order',
    'config.fields.screens.label': 'Screens',
    'config.fields.description.label': 'Description',
    'config.values.title': 'Choice values',
    'config.values.description': 'Choose which option of each mapped field has which meaning.',
    'config.values.missing': 'Not in the options',
    'config.values.selectFieldFirst': 'Map the field first',
    'config.values.kindJs': 'Kind: JavaScript',
    'config.values.kindCss': 'Kind: CSS',
    'config.values.scopePrivate': 'Scope: only me',
    'config.values.scopePublic': 'Scope: everyone',
    'config.values.statusEnabled': 'Status: enabled',
    'config.values.statusDisabled': 'Status: disabled',
    'config.values.screenIndex': 'Screen: list',
    'config.values.screenDetail': 'Screen: detail',
    'config.values.screenCreate': 'Screen: create',
    'config.values.screenEdit': 'Screen: edit',
    'config.values.permissionPost': 'Permission: create (POST)',
    'config.values.permissionPut': 'Permission: update (PUT)',
    'config.values.permissionDelete': 'Permission: delete (DELETE)',
    'config.values.permissionExternalListed': 'Permission: external (listed destinations)',
    'config.values.permissionExternalAll': 'Permission: external (any destination)',
    'config.values.permissionUnrestricted': 'Permission: unrestricted',
    'config.permissions.caution':
      'Permissions are a safety net that stops a customization from accidentally doing undeclared operations. They do not stop malicious code. Restrict who can publish to everyone with the access permissions of the management app.',
    'config.permissions.defaultWarning':
      'Some options of the "Permissions" field are selected by default. Leave all of them unselected (read-only) by default.',
    'config.permissions.externalUrlsMissing':
      'Because the "Destinations" field is not mapped, "external (listed destinations)" always blocks everything.',
  },
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});

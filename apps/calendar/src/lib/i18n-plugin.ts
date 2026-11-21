import { commonUi, useTranslations } from './i18n';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';

const ui = mergeDeep(commonUi, {
  ja: {
    // Desktop - Loading
    'desktop.loading.default': '読み込み中',

    // Desktop - Calendar view types
    'desktop.calendar.viewType.month': '月',
    'desktop.calendar.viewType.week': '週',
    'desktop.calendar.viewType.fiveDay': '5日',
    'desktop.calendar.viewType.threeDay': '3日',
    'desktop.calendar.viewType.day': '日',
    'desktop.calendar.noTitle': '（タイトルなし）',

    // Desktop - Sidebar
    'desktop.sidebar.filterSchedule': '予定を絞り込む',
    'desktop.sidebar.category': 'カテゴリー',
    'desktop.sidebar.collapse': 'サイドバーを閉じる',
    'desktop.sidebar.expand': 'サイドバーを開く',

    // Desktop - Fab
    'desktop.fab.addSchedule': 'スケジュールを追加する',

    // Desktop - Dialog
    'desktop.dialog.eventTitle': 'イベントのタイトル',
    'desktop.dialog.description': '説明',
    'desktop.dialog.startDate': '開始日',
    'desktop.dialog.startDateTime': '開始日時',
    'desktop.dialog.endDate': '終了日',
    'desktop.dialog.endDateTime': '終了日時',
    'desktop.dialog.category': 'カテゴリー',
    'desktop.dialog.allDay': '終日',

    // Desktop - Recurrence input
    'desktop.dialog.recurrence.enable': '繰り返す',
    'desktop.dialog.recurrence.frequency': '頻度',
    'desktop.dialog.recurrence.frequency.daily': '毎日',
    'desktop.dialog.recurrence.frequency.weekly': '毎週',
    'desktop.dialog.recurrence.frequency.monthly': '毎月',
    'desktop.dialog.recurrence.frequency.yearly': '毎年',
    'desktop.dialog.recurrence.interval': '間隔',
    'desktop.dialog.recurrence.monthlyMode.dayOfMonth': '同じ日付',
    'desktop.dialog.recurrence.monthlyMode.weekdayOfMonth': '同じ週・曜日',
    'desktop.dialog.recurrence.end.never': '終了しない',
    'desktop.dialog.recurrence.end.onDate': '終了日を指定',
    'desktop.dialog.recurrence.end.afterCount': '回数を指定',

    // Desktop - Recurrence field replacement (detailed edit mode)
    'desktop.recurrenceField.label': '繰り返し設定',
    'desktop.recurrenceField.overrideNotice':
      'この回のみの予定は、繰り返し設定を個別に編集することはできません',

    // Desktop - Occurrence scope dialog (recurring events)
    'desktop.dialog.occurrenceScope.title': 'この予定は繰り返し予定です',
    'desktop.dialog.occurrenceScope.editThis': 'この回のみ編集',
    'desktop.dialog.occurrenceScope.deleteThis': 'この回のみ削除',
    'desktop.dialog.occurrenceScope.editSeries': 'シリーズ全体を編集',
    'desktop.dialog.occurrenceScope.deleteSeries': 'シリーズ全体を削除',
    'desktop.dialog.occurrenceScope.cancel': 'キャンセル',

    // Desktop - Toast messages
    'desktop.toast.eventCopied': 'イベントのコピーしました',
    'desktop.toast.recordDeleted': 'レコードの削除が完了しました',

    // Desktop - Error messages
    'desktop.error.recordSaveFailed': 'レコードの保存に失敗しました: {0}',
    'desktop.error.recordFetchFailed': 'レコードの取得に失敗しました',
    'desktop.error.recordUpdateFailed': 'レコードの更新に失敗しました: {0}',
    'desktop.error.recordDeleteFailed': 'レコードの削除に失敗しました: {0}',
    'desktop.error.eventClickFailed': 'クリックしたイベントの取得に失敗しました',
    'desktop.error.cannotCopyNewEvent': '新規イベントをコピーすることはできません',
    'desktop.error.eventRecordNotFound':
      '対象イベントに紐づくレコード情報の取得に失敗しました、一覧を再表示した上で再度お試しください',
    'desktop.error.scheduleRecordNotFound':
      'スケジュールに紐づくレコードが存在しません、一覧を更新し、再度お試しください',
    'desktop.error.recurrenceMasterNotFound':
      '繰り返し予定の元となるレコードが見つかりませんでした、一覧を更新し、再度お試しください',
    'desktop.error.eventCopySuffix': ' (コピー)',
    'desktop.error.detailedRefreshFailed':
      'レコードの反映に失敗しました、一覧を再表示してご確認ください',

    // Desktop - Detailed edit dialog (kintone standard record screen in iframe)
    'desktop.detailedDialog.createTitle': 'レコードの追加',
    'desktop.detailedDialog.editTitle': 'レコードの編集',
    'desktop.detailedDialog.loading': '読み込んでいます',

    // Config - Loading
    'config.loading.waitingForRender': '画面の描画を待機しています',
    'config.loading.fetchingSettings': '設定情報を取得しています',

    // Config - Sidebar
    'config.sidebar.notSet': '未設定',
    'config.sidebar.settingLabel': '設定{0}',

    // Config - Toast messages
    'config.toast.settingDeleted': '設定情報を削除しました',
    'config.toast.settingCopied': '設定情報をコピーしました',
    'config.toast.settingPasted': '設定情報を貼り付けました',
    'config.toast.settingInvalidFormat': '設定情報の形式が正しくありません',
    'config.toast.conditionDeleted': '設定を削除しました',
    'config.toast.settingSaved': '設定を保存しました',
    'config.toast.settingReset': '設定をリセットしました',
    'config.toast.settingImported': '設定情報をインポートしました',
    'config.toast.settingImportFailed':
      '設定情報のインポートに失敗しました、ファイルに誤りがないか確認してください',
    'config.toast.settingExported': 'プラグインの設定情報をエクスポートしました',
    'config.toast.settingExportFailed':
      'プラグインの設定情報のエクスポートに失敗しました。プラグイン開発者にお問い合わせください。',
    'config.toast.viewCreated': '一覧を作成しました',
    'config.toast.viewCreationFailed': '一覧の作成に失敗しました',

    // Config - Error messages
    'config.error.appIdNotFound': 'アプリIDが取得できませんでした',
    'config.error.rootElementNotFound': 'プラグインのHTMLに、ルート要素が存在しません。',
    'config.error.fieldInfoNotFound': 'アプリのフィールド情報が取得できませんでした',
    'config.error.viewInfoNotFound': 'アプリのビュー情報を取得できませんでした',

    // Config - Form section titles
    'config.section.viewSettings.title': 'テーブルを表示する一覧の設定',
    'config.section.viewSettings.description': 'カレンダーを表示する一覧を選択してください',
    'config.section.scheduleTitle.title': 'スケジュールのタイトル',
    'config.section.scheduleTitle.description':
      'スケジュールのタイトルとして使用するフィールドを選択してください',
    'config.section.scheduleTitle.description2':
      '使用できるフィールドタイプは、文字列１行フィールド、文字列複数行フィールド、リッチテキストです',
    'config.section.scheduleStart.title': 'スケジュールの開始日時',
    'config.section.scheduleStart.description':
      'スケジュールの開始日時として使用するフィールドを選択してください',
    'config.section.scheduleStart.description2':
      '「日付」フィールドを設定した場合は、無条件で終日扱いとなります',
    'config.section.scheduleEnd.title': 'スケジュールの終了日付',
    'config.section.scheduleEnd.description':
      'スケジュールの終了日付として使用するフィールドを選択してください',
    'config.section.scheduleEnd.description2':
      '「日付」フィールドを設定した場合は、無条件で終日扱いとなります',
    'config.section.allDay.title': '終日設定',
    'config.section.allDay.description': '時刻を指定せず、終日の予定を有効にします',
    'config.section.allDay.enableLabel': '終日設定を有効にする',
    'config.section.note.title': 'スケジュールの備考',
    'config.section.note.description':
      'カレンダーから編集することのできるスケジュールの備忘を有効にします',
    'config.section.note.description2':
      '使用できるフィールドタイプは、文字列１行フィールド、文字列複数行フィールド、リッチテキストです',
    'config.section.note.enableLabel': 'スケジュールの備考を有効にする',
    'config.section.recurrence.title': '繰り返し予定',
    'config.section.recurrence.description':
      'カレンダーから毎週・毎月などの繰り返し予定を作成できるようにします',
    'config.section.recurrence.description2':
      '使用できるフィールドタイプは、文字列1行フィールド、文字列複数行フィールドです。このフィールドにはプラグイン内部用のデータが保存されるため、レコード一覧などで直接編集しないでください',
    'config.section.recurrence.enableLabel': '繰り返し予定を有効にする',
    'config.section.editMode.title': '編集モード',
    'config.section.editMode.description':
      '予定の追加・編集方法を選択してください。簡易編集ではプラグイン独自のダイアログで編集します。詳細編集ではkintone標準のレコード追加・編集画面をダイアログ内に表示するため、必須フィールドが設定されている場合でも予定を追加できます。なお、詳細編集はPC版のみ対応しており、モバイル版では簡易編集で表示されます(必須フィールドが設定されている場合、モバイル版からは予定を追加できないことがあります)',
    'config.section.editMode.description2':
      '繰り返し予定を有効にしている場合、詳細編集ではレコード編集画面上の繰り返し設定フィールドがプラグイン独自の入力UIに置き換えられます',
    'config.section.advanced': '高度な設定',
    'config.section.initialView.title': '初期表示するカレンダーの種類',
    'config.section.initialView.description': '初期表示するカレンダーの種類を選択してください',
    'config.section.slotMinmax.title': '表示時間帯の設定',
    'config.section.slotMinmax.description': 'カレンダーに表示する時間帯の上限と下限を設定します。',
    'config.section.businessDays.title': '営業日の設定',
    'config.section.businessDays.description': 'カレンダーで営業日とする曜日を設定します',
    'config.section.businessDays.description2':
      'チェックを外した曜日は、カレンダー上でグレーアウトされます',
    'config.section.firstDay.title': '週の始まりの曜日',
    'config.section.firstDay.description': '1週間の始まりとする曜日を設定します',
    'config.section.firstDay.description2':
      'ここで設定した曜日が、週表示、月表示時の左端の曜日となります',
    'config.section.category.title': 'カテゴリー設定',
    'config.section.category.description':
      'カレンダーのカテゴリーとして使用するフィールドを設定します',
    'config.section.category.description2': 'カレンダーはカテゴリーに応じて色分けされます',
    'config.section.category.description3':
      '使用できるフィールドタイプは、チェックボックス、ラジオボタン、ドロップダウンです',
    'config.section.colors.title': 'スケジュールの色',
    'config.section.colors.description': 'カレンダーに登録するスケジュールの色を設定します。',
    'config.section.colors.description2':
      'カテゴリーを使用しない場合、スケジュールは必ず１つ目の色になります',

    // Config - Form labels
    'config.form.viewName': '一覧の名前',
    'config.form.calendarType': 'カレンダーの種類',
    'config.form.slotStart': '開始',
    'config.form.slotEnd': '終了',
    'config.form.hour': '時',
    'config.form.firstDay': '週の始まりの曜日',
    'config.form.editMode': '編集方法',
    'config.form.editMode.simple': '簡易編集（専用ダイアログ）',
    'config.form.editMode.detailed': '詳細編集（kintone標準画面）',
    'config.form.colorLabel': '色{0}',
    'config.form.addColor': '色設定を追加する',
    'config.form.deleteColor': 'この色設定を削除する',
    'config.form.allDayValue': '終日とする値',
    'config.form.selectField': 'フィールドを選択してください',
    'config.form.createNewView': '一覧を新規作成',
    'config.form.calendarName': '📆 カレンダー',

    // Config - Initial view options
    'config.initialView.dayGridMonth': '日単位、１ヶ月のカレンダー',
    'config.initialView.timeGridWeek': '時間単位、１週間のカレンダー',
    'config.initialView.timeGridFiveDay': '時間単位、5日間のカレンダー',
    'config.initialView.timeGridThreeDay': '時間単位、3日のカレンダー',
    'config.initialView.timeGridDay': '時間単位、１日のカレンダー',

    // Config - Footer buttons
    'config.footer.save': '設定を保存',
    'config.footer.backToPluginList': 'プラグイン一覧へ戻る',
    'config.footer.backToPluginListShort': 'プラグイン一覧に戻る',

    // Desktop/Config - Calendar features
    'desktop.calendar.noPermission': '（アクセス権がありません）',
    'desktop.confirm.ok': 'OK',
    'desktop.confirm.cancel': 'キャンセル',
    'desktop.confirm.deleteTitle': '予定の削除',
    'desktop.confirm.deleteMessage': '「{0}」を削除しますか？この操作は取り消せません',
    'desktop.confirm.deleteSeriesMessage':
      '繰り返し予定「{0}」のすべての回を削除しますか？この操作は取り消せません',
    'desktop.confirm.rescheduleTitle': '予定の日時の変更',
    'desktop.confirm.rescheduleMessage': '「{0}」の日時を変更しますか？',
    'desktop.contextMenu.showDetail': '詳細を表示',
    'desktop.contextMenu.edit': '編集',
    'desktop.contextMenu.copy': '複製',
    'desktop.contextMenu.delete': '削除',
    'desktop.contextMenu.changeCategory': '色（カテゴリー）を変更',
    'desktop.dialog.backgroundEvent': '背景として表示',
    'desktop.legend.label': 'カテゴリーの凡例',
    'config.firstDay.today': '今日の曜日',
    'config.form.displayTitleField': '表示用タイトルのフィールド',
    'config.form.slotDuration': '時刻の間隔',
    'config.form.minutes': '{0}分',
    'config.form.nextDayHour': '翌{0}時',
    'config.form.slotRangeInvalid': '終了は開始より後にしてください',
    'config.form.scrollsToNow': '表示時に現在時刻付近まで自動でスクロールする',
    'config.form.enablesDragAndDrop': 'ドラッグ&ドロップで予定の日時を変更できるようにする',
    'config.form.confirmsReschedule': '日時を変更する前に確認する',
    'config.form.preventsOverlap': '予定の時間帯の重複を禁止する',
    'config.form.showsLegend': 'カレンダーの上部にカテゴリーの凡例を表示する',
    'config.form.backgroundEventValue': '背景イベントとする値',
    'config.form.backgroundEventValueRequired': '背景イベントとする値を選択してください',
    'config.form.sortOrder': '並び順',
    'config.form.sortOrder.asc': '昇順',
    'config.form.sortOrder.desc': '降順',
    'config.section.displayTitle.title': '表示用タイトル（任意）',
    'config.section.displayTitle.description':
      'カレンダー上に、スケジュールのタイトルの代わりに表示するフィールドを選択してください。未設定の場合はスケジュールのタイトルを表示します',
    'config.section.displayTitle.description2':
      '計算フィールドなどで、複数の項目を組み合わせたタイトルを表示したい場合に使用します。カレンダーから入力・変更されるのは、スケジュールのタイトルのフィールドです',
    'config.section.interaction.title': '予定の操作',
    'config.section.interaction.description':
      'カレンダー上でのドラッグ&ドロップによる予定の操作を設定します',
    'config.section.interaction.description2':
      '重複の禁止は、カレンダー上でのドラッグ&ドロップ・範囲選択にのみ適用されます。背景イベントとの重複は禁止されません',
    'config.section.slotMinmax.description2':
      '終了を24時より後にすると、夜勤のような日をまたぐ時間帯を1日の枠内に表示できます',
    'config.section.visibleViews.title': '表示形式の切り替えボタン',
    'config.section.visibleViews.description':
      'カレンダーの上部に表示する、表示形式の切り替えボタンを選択します',
    'config.section.visibleViews.description2':
      '何も選択しない場合は、すべてのボタンを表示します。1つだけ選択した場合は、切り替えボタン自体を表示しません。同じタブで再表示した場合は、前回の表示形式で表示されます',
    'config.section.backgroundEvent.title': '背景イベント',
    'config.section.backgroundEvent.description':
      '祝日や休業日、勤務時間帯などの予定を、カレンダーの背景として表示します。背景イベントの上には通常の予定を登録できます',
    'config.section.backgroundEvent.description2':
      '使用できるフィールドタイプはチェックボックスです。指定した値にチェックが入っているレコードが背景イベントになります。週・日表示の背景イベントは、右クリックメニューの対象外です',
    'config.section.backgroundEvent.enableLabel': '背景イベントを有効にする',
    'config.section.sort.title': '予定の並び順',
    'config.section.sort.description':
      '同じ時刻に始まる予定を並べる順番を決めるフィールドを選択してください。未設定の場合はタイトル順になります',
    'config.section.sort.description2':
      '使用できるフィールドタイプは、数値、計算、文字列1行、ドロップダウン、ラジオボタン、日付、日時、時刻です。ドロップダウンとラジオボタンは選択肢の順番で並べます',

    // Common - Weekdays
    'common.weekday.sunday': '日曜日',
    'common.weekday.monday': '月曜日',
    'common.weekday.tuesday': '火曜日',
    'common.weekday.wednesday': '水曜日',
    'common.weekday.thursday': '木曜日',
    'common.weekday.friday': '金曜日',
    'common.weekday.saturday': '土曜日',

    // Common - Field select
    'common.field.codePrefix': 'コード: ',
    'common.field.targetField': '対象フィールド',
    'common.field.selectPlaceholder': 'フィールドを選択してください',

    // Common - Error
    'common.error.pluginError': 'プラグイン「{0}」の処理内でエラーが発生しました。',
  },
  en: {
    // Desktop - Loading
    'desktop.loading.default': 'Loading',

    // Desktop - Calendar view types
    'desktop.calendar.viewType.month': 'Month',
    'desktop.calendar.viewType.week': 'Week',
    'desktop.calendar.viewType.fiveDay': '5 Days',
    'desktop.calendar.viewType.threeDay': '3 Days',
    'desktop.calendar.viewType.day': 'Day',
    'desktop.calendar.noTitle': '(No Title)',

    // Desktop - Sidebar
    'desktop.sidebar.filterSchedule': 'Filter schedules',
    'desktop.sidebar.category': 'Category',
    'desktop.sidebar.collapse': 'Collapse sidebar',
    'desktop.sidebar.expand': 'Expand sidebar',

    // Desktop - Fab
    'desktop.fab.addSchedule': 'Add schedule',

    // Desktop - Dialog
    'desktop.dialog.eventTitle': 'Event title',
    'desktop.dialog.description': 'Description',
    'desktop.dialog.startDate': 'Start date',
    'desktop.dialog.startDateTime': 'Start date/time',
    'desktop.dialog.endDate': 'End date',
    'desktop.dialog.endDateTime': 'End date/time',
    'desktop.dialog.category': 'Category',
    'desktop.dialog.allDay': 'All day',

    // Desktop - Recurrence input
    'desktop.dialog.recurrence.enable': 'Repeat',
    'desktop.dialog.recurrence.frequency': 'Frequency',
    'desktop.dialog.recurrence.frequency.daily': 'Daily',
    'desktop.dialog.recurrence.frequency.weekly': 'Weekly',
    'desktop.dialog.recurrence.frequency.monthly': 'Monthly',
    'desktop.dialog.recurrence.frequency.yearly': 'Yearly',
    'desktop.dialog.recurrence.interval': 'Interval',
    'desktop.dialog.recurrence.monthlyMode.dayOfMonth': 'Same day of month',
    'desktop.dialog.recurrence.monthlyMode.weekdayOfMonth': 'Same week & weekday',
    'desktop.dialog.recurrence.end.never': 'Never ends',
    'desktop.dialog.recurrence.end.onDate': 'Ends on date',
    'desktop.dialog.recurrence.end.afterCount': 'Ends after N occurrences',

    // Desktop - Recurrence field replacement (detailed edit mode)
    'desktop.recurrenceField.label': 'Recurrence settings',
    'desktop.recurrenceField.overrideNotice':
      'This single occurrence cannot have its own recurrence settings edited',

    // Desktop - Occurrence scope dialog (recurring events)
    'desktop.dialog.occurrenceScope.title': 'This is a recurring event',
    'desktop.dialog.occurrenceScope.editThis': 'Edit this occurrence',
    'desktop.dialog.occurrenceScope.deleteThis': 'Delete this occurrence',
    'desktop.dialog.occurrenceScope.editSeries': 'Edit the entire series',
    'desktop.dialog.occurrenceScope.deleteSeries': 'Delete the entire series',
    'desktop.dialog.occurrenceScope.cancel': 'Cancel',

    // Desktop - Toast messages
    'desktop.toast.eventCopied': 'Event copied',
    'desktop.toast.recordDeleted': 'Record deleted successfully',

    // Desktop - Error messages
    'desktop.error.recordSaveFailed': 'Failed to save record: {0}',
    'desktop.error.recordFetchFailed': 'Failed to fetch records',
    'desktop.error.recordUpdateFailed': 'Failed to update record: {0}',
    'desktop.error.recordDeleteFailed': 'Failed to delete record: {0}',
    'desktop.error.eventClickFailed': 'Failed to get clicked event',
    'desktop.error.cannotCopyNewEvent': 'Cannot copy a new event',
    'desktop.error.eventRecordNotFound':
      'Failed to get record information for the target event. Please refresh the list and try again.',
    'desktop.error.scheduleRecordNotFound':
      'No record exists for this schedule. Please refresh the list and try again.',
    'desktop.error.recurrenceMasterNotFound':
      'The source record for this recurring event was not found. Please refresh the list and try again.',
    'desktop.error.eventCopySuffix': ' (Copy)',
    'desktop.error.detailedRefreshFailed':
      'Failed to reflect the record. Please refresh the list to check.',

    // Desktop - Detailed edit dialog (kintone standard record screen in iframe)
    'desktop.detailedDialog.createTitle': 'Add record',
    'desktop.detailedDialog.editTitle': 'Edit record',
    'desktop.detailedDialog.loading': 'Loading',

    // Config - Loading
    'config.loading.waitingForRender': 'Waiting for screen to render',
    'config.loading.fetchingSettings': 'Loading settings',

    // Config - Sidebar
    'config.sidebar.notSet': 'Not set',
    'config.sidebar.settingLabel': 'Setting {0}',

    // Config - Toast messages
    'config.toast.settingDeleted': 'Setting deleted',
    'config.toast.settingCopied': 'Setting copied',
    'config.toast.settingPasted': 'Setting pasted',
    'config.toast.settingInvalidFormat': 'Invalid setting format',
    'config.toast.conditionDeleted': 'Condition deleted',
    'config.toast.settingSaved': 'Settings saved',
    'config.toast.settingReset': 'Settings reset',
    'config.toast.settingImported': 'Settings imported',
    'config.toast.settingImportFailed':
      'Failed to import settings. Please check the file for errors.',
    'config.toast.settingExported': 'Plugin settings exported',
    'config.toast.settingExportFailed':
      'Failed to export plugin settings. Please contact the plugin developer.',
    'config.toast.viewCreated': 'View created',
    'config.toast.viewCreationFailed': 'Failed to create view',

    // Config - Error messages
    'config.error.appIdNotFound': 'Could not get app ID',
    'config.error.rootElementNotFound': 'Root element does not exist in plugin HTML.',
    'config.error.fieldInfoNotFound': 'Could not get app field information',
    'config.error.viewInfoNotFound': 'Could not get app view information',

    // Config - Form section titles
    'config.section.viewSettings.title': 'View settings for displaying calendar',
    'config.section.viewSettings.description': 'Select the view to display the calendar',
    'config.section.scheduleTitle.title': 'Schedule title',
    'config.section.scheduleTitle.description': 'Select the field to use as the schedule title',
    'config.section.scheduleTitle.description2':
      'Available field types: Single line text, Multi-line text, Rich text',
    'config.section.scheduleStart.title': 'Schedule start date/time',
    'config.section.scheduleStart.description':
      'Select the field to use as the schedule start date/time',
    'config.section.scheduleStart.description2':
      'If a "Date" field is set, it will be treated as an all-day event',
    'config.section.scheduleEnd.title': 'Schedule end date',
    'config.section.scheduleEnd.description': 'Select the field to use as the schedule end date',
    'config.section.scheduleEnd.description2':
      'If a "Date" field is set, it will be treated as an all-day event',
    'config.section.allDay.title': 'All day setting',
    'config.section.allDay.description': 'Enable all-day events without specifying time',
    'config.section.allDay.enableLabel': 'Enable all day setting',
    'config.section.note.title': 'Schedule notes',
    'config.section.note.description': 'Enable schedule notes that can be edited from the calendar',
    'config.section.note.description2':
      'Available field types: Single line text, Multi-line text, Rich text',
    'config.section.note.enableLabel': 'Enable schedule notes',
    'config.section.recurrence.title': 'Recurring events',
    'config.section.recurrence.description':
      'Allow creating recurring events (weekly, monthly, etc.) from the calendar',
    'config.section.recurrence.description2':
      'Available field types: Single line text, Multi-line text. This field stores internal plugin data — do not edit it directly from the record list',
    'config.section.recurrence.enableLabel': 'Enable recurring events',
    'config.section.editMode.title': 'Edit mode',
    'config.section.editMode.description':
      "Choose how schedules are added and edited. Simple edit uses the plugin's own dialog. Detailed edit shows the kintone standard record add/edit screen in a dialog, so schedules can be added even when required fields are configured. Detailed edit is available on desktop only; the mobile version always uses simple edit (if required fields are configured, schedules may not be addable from mobile)",
    'config.section.editMode.description2':
      "When recurring events are enabled, detailed edit replaces the recurrence field on the record edit screen with the plugin's own input UI",
    'config.section.advanced': 'Advanced settings',
    'config.section.initialView.title': 'Initial calendar view type',
    'config.section.initialView.description': 'Select the initial calendar view type',
    'config.section.slotMinmax.title': 'Display time range settings',
    'config.section.slotMinmax.description':
      'Set the upper and lower limits of time slots displayed on the calendar.',
    'config.section.businessDays.title': 'Business days settings',
    'config.section.businessDays.description':
      'Set the days of the week to be treated as business days',
    'config.section.businessDays.description2': 'Unchecked days will be grayed out on the calendar',
    'config.section.firstDay.title': 'First day of week',
    'config.section.firstDay.description': 'Set the day to start the week',
    'config.section.firstDay.description2':
      'This day will be the leftmost day in week and month views',
    'config.section.category.title': 'Category settings',
    'config.section.category.description': 'Set the field to use as calendar category',
    'config.section.category.description2': 'Calendar events will be color-coded by category',
    'config.section.category.description3':
      'Available field types: Checkbox, Radio button, Dropdown',
    'config.section.colors.title': 'Schedule colors',
    'config.section.colors.description': 'Set colors for calendar schedules.',
    'config.section.colors.description2':
      'If no category is used, schedules will always use the first color',

    // Config - Form labels
    'config.form.viewName': 'View name',
    'config.form.calendarType': 'Calendar type',
    'config.form.slotStart': 'Start',
    'config.form.slotEnd': 'End',
    'config.form.hour': '',
    'config.form.firstDay': 'First day of week',
    'config.form.editMode': 'Edit method',
    'config.form.editMode.simple': 'Simple edit (dedicated dialog)',
    'config.form.editMode.detailed': 'Detailed edit (kintone standard screen)',
    'config.form.colorLabel': 'Color {0}',
    'config.form.addColor': 'Add color setting',
    'config.form.deleteColor': 'Delete this color setting',
    'config.form.allDayValue': 'All day value',
    'config.form.selectField': 'Select a field',
    'config.form.createNewView': 'Create new view',
    'config.form.calendarName': '📆 Calendar',

    // Config - Initial view options
    'config.initialView.dayGridMonth': 'Day grid, 1 month calendar',
    'config.initialView.timeGridWeek': 'Time grid, 1 week calendar',
    'config.initialView.timeGridFiveDay': 'Time grid, 5 days calendar',
    'config.initialView.timeGridThreeDay': 'Time grid, 3 days calendar',
    'config.initialView.timeGridDay': 'Time grid, 1 day calendar',

    // Config - Footer buttons
    'config.footer.save': 'Save settings',
    'config.footer.backToPluginList': 'Back to plugin list',
    'config.footer.backToPluginListShort': 'Back to plugin list',

    // Desktop/Config - Calendar features
    'desktop.calendar.noPermission': '(No access permission)',
    'desktop.confirm.ok': 'OK',
    'desktop.confirm.cancel': 'Cancel',
    'desktop.confirm.deleteTitle': 'Delete event',
    'desktop.confirm.deleteMessage': 'Delete "{0}"? This cannot be undone.',
    'desktop.confirm.deleteSeriesMessage':
      'Delete all occurrences of the recurring event "{0}"? This cannot be undone.',
    'desktop.confirm.rescheduleTitle': 'Change event time',
    'desktop.confirm.rescheduleMessage': 'Change the date and time of "{0}"?',
    'desktop.contextMenu.showDetail': 'Show details',
    'desktop.contextMenu.edit': 'Edit',
    'desktop.contextMenu.copy': 'Duplicate',
    'desktop.contextMenu.delete': 'Delete',
    'desktop.contextMenu.changeCategory': 'Change color (category)',
    'desktop.dialog.backgroundEvent': 'Show as background',
    'desktop.legend.label': 'Category legend',
    'config.firstDay.today': "Today's day of the week",
    'config.form.displayTitleField': 'Display title field',
    'config.form.slotDuration': 'Time interval',
    'config.form.minutes': '{0} min',
    'config.form.nextDayHour': '{0} (next day)',
    'config.form.slotRangeInvalid': 'The end must be later than the start',
    'config.form.scrollsToNow': 'Automatically scroll to around the current time when displayed',
    'config.form.enablesDragAndDrop': 'Allow changing event times by drag and drop',
    'config.form.confirmsReschedule': 'Ask for confirmation before changing the time',
    'config.form.preventsOverlap': 'Prevent events from overlapping',
    'config.form.showsLegend': 'Show the category legend above the calendar',
    'config.form.backgroundEventValue': 'Value for background events',
    'config.form.backgroundEventValueRequired': 'Select the value for background events',
    'config.form.sortOrder': 'Order',
    'config.form.sortOrder.asc': 'Ascending',
    'config.form.sortOrder.desc': 'Descending',
    'config.section.displayTitle.title': 'Display title (optional)',
    'config.section.displayTitle.description':
      'Select a field to display on the calendar instead of the event title. If not set, the event title is displayed.',
    'config.section.displayTitle.description2':
      'Use this to show a title that combines several values, e.g. with a calculated field. Input from the calendar is still saved to the event title field.',
    'config.section.interaction.title': 'Event operations',
    'config.section.interaction.description':
      'Configure how events can be operated by drag and drop on the calendar.',
    'config.section.interaction.description2':
      'Overlap prevention applies only to drag and drop and range selection on the calendar. Overlapping background events is always allowed.',
    'config.section.slotMinmax.description2':
      'Setting the end later than 24:00 lets you show time ranges that span midnight, such as night shifts, within a single day.',
    'config.section.visibleViews.title': 'View switch buttons',
    'config.section.visibleViews.description':
      'Select the view switch buttons shown above the calendar.',
    'config.section.visibleViews.description2':
      'If nothing is selected, all buttons are shown. If only one is selected, the switcher is hidden. When reopened in the same tab, the last used view is restored.',
    'config.section.backgroundEvent.title': 'Background events',
    'config.section.backgroundEvent.description':
      'Show events such as holidays, closed days or working hours as the calendar background. Regular events can be added on top of them.',
    'config.section.backgroundEvent.description2':
      'Only checkbox fields can be used. Records with the specified value checked become background events. Background events in week and day views do not support the context menu.',
    'config.section.backgroundEvent.enableLabel': 'Enable background events',
    'config.section.sort.title': 'Event order',
    'config.section.sort.description':
      'Select a field that determines the order of events starting at the same time. If not set, events are ordered by title.',
    'config.section.sort.description2':
      'Available field types: number, calculated, text, drop-down, radio button, date, date and time, and time. Drop-down and radio button fields are ordered by their option order.',

    // Common - Weekdays
    'common.weekday.sunday': 'Sunday',
    'common.weekday.monday': 'Monday',
    'common.weekday.tuesday': 'Tuesday',
    'common.weekday.wednesday': 'Wednesday',
    'common.weekday.thursday': 'Thursday',
    'common.weekday.friday': 'Friday',
    'common.weekday.saturday': 'Saturday',

    // Common - Field select
    'common.field.codePrefix': 'Code: ',
    'common.field.targetField': 'Target field',
    'common.field.selectPlaceholder': 'Select a field',

    // Common - Error
    'common.error.pluginError': 'An error occurred in the plugin "{0}".',
  },
  es: {
    // Desktop - Loading
    'desktop.loading.default': 'Cargando',

    // Desktop - Calendar view types
    'desktop.calendar.viewType.month': 'Mes',
    'desktop.calendar.viewType.week': 'Semana',
    'desktop.calendar.viewType.fiveDay': '5 días',
    'desktop.calendar.viewType.threeDay': '3 días',
    'desktop.calendar.viewType.day': 'Día',
    'desktop.calendar.noTitle': '(Sin título)',

    // Desktop - Sidebar
    'desktop.sidebar.filterSchedule': 'Filtrar horarios',
    'desktop.sidebar.category': 'Categoría',
    'desktop.sidebar.collapse': 'Contraer barra lateral',
    'desktop.sidebar.expand': 'Expandir barra lateral',

    // Desktop - Fab
    'desktop.fab.addSchedule': 'Agregar horario',

    // Desktop - Dialog
    'desktop.dialog.eventTitle': 'Título del evento',
    'desktop.dialog.description': 'Descripción',
    'desktop.dialog.startDate': 'Fecha de inicio',
    'desktop.dialog.startDateTime': 'Fecha/hora de inicio',
    'desktop.dialog.endDate': 'Fecha de fin',
    'desktop.dialog.endDateTime': 'Fecha/hora de fin',
    'desktop.dialog.category': 'Categoría',
    'desktop.dialog.allDay': 'Todo el día',

    // Desktop - Recurrence input
    'desktop.dialog.recurrence.enable': 'Repetir',
    'desktop.dialog.recurrence.frequency': 'Frecuencia',
    'desktop.dialog.recurrence.frequency.daily': 'Diariamente',
    'desktop.dialog.recurrence.frequency.weekly': 'Semanalmente',
    'desktop.dialog.recurrence.frequency.monthly': 'Mensualmente',
    'desktop.dialog.recurrence.frequency.yearly': 'Anualmente',
    'desktop.dialog.recurrence.interval': 'Intervalo',
    'desktop.dialog.recurrence.monthlyMode.dayOfMonth': 'Mismo día del mes',
    'desktop.dialog.recurrence.monthlyMode.weekdayOfMonth': 'Misma semana y día',
    'desktop.dialog.recurrence.end.never': 'Nunca termina',
    'desktop.dialog.recurrence.end.onDate': 'Termina en una fecha',
    'desktop.dialog.recurrence.end.afterCount': 'Termina después de N repeticiones',

    // Desktop - Recurrence field replacement (detailed edit mode)
    'desktop.recurrenceField.label': 'Configuración de recurrencia',
    'desktop.recurrenceField.overrideNotice':
      'Esta ocurrencia individual no puede tener su propia configuración de recurrencia editada',

    // Desktop - Occurrence scope dialog (recurring events)
    'desktop.dialog.occurrenceScope.title': 'Este es un evento recurrente',
    'desktop.dialog.occurrenceScope.editThis': 'Editar solo esta ocurrencia',
    'desktop.dialog.occurrenceScope.deleteThis': 'Eliminar solo esta ocurrencia',
    'desktop.dialog.occurrenceScope.editSeries': 'Editar toda la serie',
    'desktop.dialog.occurrenceScope.deleteSeries': 'Eliminar toda la serie',
    'desktop.dialog.occurrenceScope.cancel': 'Cancelar',

    // Desktop - Toast messages
    'desktop.toast.eventCopied': 'Evento copiado',
    'desktop.toast.recordDeleted': 'Registro eliminado exitosamente',

    // Desktop - Error messages
    'desktop.error.recordSaveFailed': 'Error al guardar registro: {0}',
    'desktop.error.recordFetchFailed': 'Error al obtener registros',
    'desktop.error.recordUpdateFailed': 'Error al actualizar registro: {0}',
    'desktop.error.recordDeleteFailed': 'Error al eliminar registro: {0}',
    'desktop.error.eventClickFailed': 'Error al obtener evento seleccionado',
    'desktop.error.cannotCopyNewEvent': 'No se puede copiar un evento nuevo',
    'desktop.error.eventRecordNotFound':
      'Error al obtener información del registro. Por favor actualice la lista e intente de nuevo.',
    'desktop.error.scheduleRecordNotFound':
      'No existe un registro para este horario. Por favor actualice la lista e intente de nuevo.',
    'desktop.error.recurrenceMasterNotFound':
      'No se encontró el registro de origen de este evento recurrente. Por favor actualice la lista e intente de nuevo.',
    'desktop.error.eventCopySuffix': ' (Copia)',
    'desktop.error.detailedRefreshFailed':
      'Error al reflejar el registro. Por favor actualice la lista para verificar.',

    // Desktop - Detailed edit dialog (kintone standard record screen in iframe)
    'desktop.detailedDialog.createTitle': 'Agregar registro',
    'desktop.detailedDialog.editTitle': 'Editar registro',
    'desktop.detailedDialog.loading': 'Cargando',

    // Config - Loading
    'config.loading.waitingForRender': 'Esperando renderizado de pantalla',
    'config.loading.fetchingSettings': 'Cargando configuración',

    // Config - Sidebar
    'config.sidebar.notSet': 'No configurado',
    'config.sidebar.settingLabel': 'Configuración {0}',

    // Config - Toast messages
    'config.toast.settingDeleted': 'Configuración eliminada',
    'config.toast.settingCopied': 'Configuración copiada',
    'config.toast.settingPasted': 'Configuración pegada',
    'config.toast.settingInvalidFormat': 'Formato de configuración inválido',
    'config.toast.conditionDeleted': 'Condición eliminada',
    'config.toast.settingSaved': 'Configuración guardada',
    'config.toast.settingReset': 'Configuración restablecida',
    'config.toast.settingImported': 'Configuración importada',
    'config.toast.settingImportFailed':
      'Error al importar configuración. Por favor verifique el archivo.',
    'config.toast.settingExported': 'Configuración del plugin exportada',
    'config.toast.settingExportFailed':
      'Error al exportar configuración. Por favor contacte al desarrollador.',
    'config.toast.viewCreated': 'Vista creada',
    'config.toast.viewCreationFailed': 'Error al crear vista',

    // Config - Error messages
    'config.error.appIdNotFound': 'No se pudo obtener el ID de la aplicación',
    'config.error.rootElementNotFound': 'El elemento raíz no existe en el HTML del plugin.',
    'config.error.fieldInfoNotFound': 'No se pudo obtener información de campos',
    'config.error.viewInfoNotFound': 'No se pudo obtener información de vistas',

    // Config - Form section titles
    'config.section.viewSettings.title': 'Configuración de vista para mostrar calendario',
    'config.section.viewSettings.description': 'Seleccione la vista para mostrar el calendario',
    'config.section.scheduleTitle.title': 'Título del horario',
    'config.section.scheduleTitle.description':
      'Seleccione el campo a usar como título del horario',
    'config.section.scheduleTitle.description2':
      'Tipos de campo disponibles: Texto de una línea, Texto multilínea, Texto enriquecido',
    'config.section.scheduleStart.title': 'Fecha/hora de inicio del horario',
    'config.section.scheduleStart.description':
      'Seleccione el campo a usar como fecha/hora de inicio',
    'config.section.scheduleStart.description2':
      'Si se configura un campo "Fecha", se tratará como evento de todo el día',
    'config.section.scheduleEnd.title': 'Fecha de fin del horario',
    'config.section.scheduleEnd.description': 'Seleccione el campo a usar como fecha de fin',
    'config.section.scheduleEnd.description2':
      'Si se configura un campo "Fecha", se tratará como evento de todo el día',
    'config.section.allDay.title': 'Configuración de todo el día',
    'config.section.allDay.description': 'Habilitar eventos de todo el día sin especificar hora',
    'config.section.allDay.enableLabel': 'Habilitar configuración de todo el día',
    'config.section.note.title': 'Notas del horario',
    'config.section.note.description': 'Habilitar notas del horario editables desde el calendario',
    'config.section.note.description2':
      'Tipos de campo disponibles: Texto de una línea, Texto multilínea, Texto enriquecido',
    'config.section.note.enableLabel': 'Habilitar notas del horario',
    'config.section.recurrence.title': 'Eventos recurrentes',
    'config.section.recurrence.description':
      'Permite crear eventos recurrentes (semanales, mensuales, etc.) desde el calendario',
    'config.section.recurrence.description2':
      'Tipos de campo disponibles: Texto de una línea, Texto multilínea. Este campo almacena datos internos del plugin — no lo edite directamente desde la lista de registros',
    'config.section.recurrence.enableLabel': 'Habilitar eventos recurrentes',
    'config.section.editMode.title': 'Modo de edición',
    'config.section.editMode.description':
      'Elija cómo se agregan y editan los horarios. La edición simple usa el propio diálogo del plugin. La edición detallada muestra la pantalla estándar de agregar/editar registro de kintone en un diálogo, para poder agregar horarios incluso cuando hay campos obligatorios configurados. La edición detallada solo está disponible en la versión de escritorio; la versión móvil siempre usa la edición simple (si hay campos obligatorios configurados, es posible que no se puedan agregar horarios desde el móvil)',
    'config.section.editMode.description2':
      'Cuando los eventos recurrentes están habilitados, la edición detallada reemplaza el campo de recurrencia en la pantalla de edición de registro con la interfaz propia del plugin',
    'config.section.advanced': 'Configuración avanzada',
    'config.section.initialView.title': 'Tipo de vista inicial del calendario',
    'config.section.initialView.description': 'Seleccione el tipo de vista inicial del calendario',
    'config.section.slotMinmax.title': 'Configuración de rango de tiempo',
    'config.section.slotMinmax.description':
      'Configure los límites de tiempo mostrados en el calendario.',
    'config.section.businessDays.title': 'Configuración de días laborables',
    'config.section.businessDays.description':
      'Configure los días de la semana como días laborables',
    'config.section.businessDays.description2': 'Los días no marcados se mostrarán en gris',
    'config.section.firstDay.title': 'Primer día de la semana',
    'config.section.firstDay.description': 'Configure el día para comenzar la semana',
    'config.section.firstDay.description2':
      'Este día será el más a la izquierda en las vistas de semana y mes',
    'config.section.category.title': 'Configuración de categoría',
    'config.section.category.description':
      'Configure el campo a usar como categoría del calendario',
    'config.section.category.description2': 'Los eventos se colorearán por categoría',
    'config.section.category.description3':
      'Tipos de campo disponibles: Casilla de verificación, Botón de radio, Menú desplegable',
    'config.section.colors.title': 'Colores del horario',
    'config.section.colors.description': 'Configure los colores para los horarios del calendario.',
    'config.section.colors.description2':
      'Si no se usa categoría, los horarios siempre usarán el primer color',

    // Config - Form labels
    'config.form.viewName': 'Nombre de vista',
    'config.form.calendarType': 'Tipo de calendario',
    'config.form.slotStart': 'Inicio',
    'config.form.slotEnd': 'Fin',
    'config.form.hour': '',
    'config.form.firstDay': 'Primer día de la semana',
    'config.form.editMode': 'Método de edición',
    'config.form.editMode.simple': 'Edición simple (diálogo dedicado)',
    'config.form.editMode.detailed': 'Edición detallada (pantalla estándar de kintone)',
    'config.form.colorLabel': 'Color {0}',
    'config.form.addColor': 'Agregar configuración de color',
    'config.form.deleteColor': 'Eliminar esta configuración de color',
    'config.form.allDayValue': 'Valor de todo el día',
    'config.form.selectField': 'Seleccione un campo',
    'config.form.createNewView': 'Crear nueva vista',
    'config.form.calendarName': '📆 Calendario',

    // Config - Initial view options
    'config.initialView.dayGridMonth': 'Cuadrícula de días, calendario de 1 mes',
    'config.initialView.timeGridWeek': 'Cuadrícula de tiempo, calendario de 1 semana',
    'config.initialView.timeGridFiveDay': 'Cuadrícula de tiempo, calendario de 5 días',
    'config.initialView.timeGridThreeDay': 'Cuadrícula de tiempo, calendario de 3 días',
    'config.initialView.timeGridDay': 'Cuadrícula de tiempo, calendario de 1 día',

    // Config - Footer buttons
    'config.footer.save': 'Guardar configuración',
    'config.footer.backToPluginList': 'Volver a lista de plugins',
    'config.footer.backToPluginListShort': 'Volver a lista de plugins',

    // Desktop/Config - Calendar features
    'desktop.calendar.noPermission': '(Sin permiso de acceso)',
    'desktop.confirm.ok': 'Aceptar',
    'desktop.confirm.cancel': 'Cancelar',
    'desktop.confirm.deleteTitle': 'Eliminar evento',
    'desktop.confirm.deleteMessage': '¿Eliminar "{0}"? Esta acción no se puede deshacer.',
    'desktop.confirm.deleteSeriesMessage':
      '¿Eliminar todas las repeticiones del evento periódico "{0}"? Esta acción no se puede deshacer.',
    'desktop.confirm.rescheduleTitle': 'Cambiar fecha del evento',
    'desktop.confirm.rescheduleMessage': '¿Cambiar la fecha y hora de "{0}"?',
    'desktop.contextMenu.showDetail': 'Ver detalles',
    'desktop.contextMenu.edit': 'Editar',
    'desktop.contextMenu.copy': 'Duplicar',
    'desktop.contextMenu.delete': 'Eliminar',
    'desktop.contextMenu.changeCategory': 'Cambiar color (categoría)',
    'desktop.dialog.backgroundEvent': 'Mostrar como fondo',
    'desktop.legend.label': 'Leyenda de categorías',
    'config.firstDay.today': 'Día de la semana de hoy',
    'config.form.displayTitleField': 'Campo del título mostrado',
    'config.form.slotDuration': 'Intervalo de tiempo',
    'config.form.minutes': '{0} min',
    'config.form.nextDayHour': '{0} (día siguiente)',
    'config.form.slotRangeInvalid': 'El final debe ser posterior al inicio',
    'config.form.scrollsToNow': 'Desplazarse automáticamente a la hora actual al mostrar',
    'config.form.enablesDragAndDrop':
      'Permitir cambiar la fecha de los eventos arrastrando y soltando',
    'config.form.confirmsReschedule': 'Pedir confirmación antes de cambiar la fecha',
    'config.form.preventsOverlap': 'Impedir que los eventos se superpongan',
    'config.form.showsLegend': 'Mostrar la leyenda de categorías encima del calendario',
    'config.form.backgroundEventValue': 'Valor para eventos de fondo',
    'config.form.backgroundEventValueRequired': 'Seleccione el valor para eventos de fondo',
    'config.form.sortOrder': 'Orden',
    'config.form.sortOrder.asc': 'Ascendente',
    'config.form.sortOrder.desc': 'Descendente',
    'config.section.displayTitle.title': 'Título mostrado (opcional)',
    'config.section.displayTitle.description':
      'Seleccione un campo para mostrar en el calendario en lugar del título del evento. Si no se establece, se muestra el título del evento.',
    'config.section.displayTitle.description2':
      'Úselo para mostrar un título que combine varios valores, por ejemplo con un campo calculado. Lo que se introduce desde el calendario se guarda en el campo del título del evento.',
    'config.section.interaction.title': 'Operaciones de eventos',
    'config.section.interaction.description':
      'Configure cómo se pueden manipular los eventos arrastrando y soltando en el calendario.',
    'config.section.interaction.description2':
      'La prevención de superposición solo se aplica al arrastrar y soltar y a la selección en el calendario. Siempre se permite superponer eventos de fondo.',
    'config.section.slotMinmax.description2':
      'Si el final es posterior a las 24:00, puede mostrar rangos que pasan la medianoche, como turnos nocturnos, dentro de un solo día.',
    'config.section.visibleViews.title': 'Botones de cambio de vista',
    'config.section.visibleViews.description':
      'Seleccione los botones de cambio de vista que se muestran encima del calendario.',
    'config.section.visibleViews.description2':
      'Si no se selecciona nada, se muestran todos los botones. Si solo se selecciona uno, el selector se oculta. Al volver a abrir en la misma pestaña, se restaura la última vista utilizada.',
    'config.section.backgroundEvent.title': 'Eventos de fondo',
    'config.section.backgroundEvent.description':
      'Muestre eventos como festivos, días de cierre u horarios laborales como fondo del calendario. Se pueden añadir eventos normales encima.',
    'config.section.backgroundEvent.description2':
      'Solo se pueden usar campos de casilla de verificación. Los registros con el valor indicado marcado se convierten en eventos de fondo. Los eventos de fondo en las vistas semanal y diaria no admiten el menú contextual.',
    'config.section.backgroundEvent.enableLabel': 'Habilitar eventos de fondo',
    'config.section.sort.title': 'Orden de los eventos',
    'config.section.sort.description':
      'Seleccione un campo que determine el orden de los eventos que comienzan a la misma hora. Si no se establece, se ordenan por título.',
    'config.section.sort.description2':
      'Tipos de campo disponibles: número, cálculo, texto, lista desplegable, botón de opción, fecha, fecha y hora y hora. Las listas desplegables y los botones de opción se ordenan según el orden de sus opciones.',

    // Common - Weekdays
    'common.weekday.sunday': 'Domingo',
    'common.weekday.monday': 'Lunes',
    'common.weekday.tuesday': 'Martes',
    'common.weekday.wednesday': 'Miércoles',
    'common.weekday.thursday': 'Jueves',
    'common.weekday.friday': 'Viernes',
    'common.weekday.saturday': 'Sábado',

    // Common - Field select
    'common.field.codePrefix': 'Código: ',
    'common.field.targetField': 'Campo objetivo',
    'common.field.selectPlaceholder': 'Seleccione un campo',

    // Common - Error
    'common.error.pluginError': 'Ocurrió un error en el plugin "{0}".',
  },
  zh: {
    // Desktop - Loading
    'desktop.loading.default': '加载中',

    // Desktop - Calendar view types
    'desktop.calendar.viewType.month': '月',
    'desktop.calendar.viewType.week': '周',
    'desktop.calendar.viewType.fiveDay': '5天',
    'desktop.calendar.viewType.threeDay': '3天',
    'desktop.calendar.viewType.day': '日',
    'desktop.calendar.noTitle': '（无标题）',

    // Desktop - Sidebar
    'desktop.sidebar.filterSchedule': '筛选日程',
    'desktop.sidebar.category': '类别',
    'desktop.sidebar.collapse': '收起侧边栏',
    'desktop.sidebar.expand': '展开侧边栏',

    // Desktop - Fab
    'desktop.fab.addSchedule': '添加日程',

    // Desktop - Dialog
    'desktop.dialog.eventTitle': '事件标题',
    'desktop.dialog.description': '描述',
    'desktop.dialog.startDate': '开始日期',
    'desktop.dialog.startDateTime': '开始日期/时间',
    'desktop.dialog.endDate': '结束日期',
    'desktop.dialog.endDateTime': '结束日期/时间',
    'desktop.dialog.category': '类别',
    'desktop.dialog.allDay': '全天',

    // Desktop - Recurrence input
    'desktop.dialog.recurrence.enable': '重复',
    'desktop.dialog.recurrence.frequency': '频率',
    'desktop.dialog.recurrence.frequency.daily': '每天',
    'desktop.dialog.recurrence.frequency.weekly': '每周',
    'desktop.dialog.recurrence.frequency.monthly': '每月',
    'desktop.dialog.recurrence.frequency.yearly': '每年',
    'desktop.dialog.recurrence.interval': '间隔',
    'desktop.dialog.recurrence.monthlyMode.dayOfMonth': '每月同一天',
    'desktop.dialog.recurrence.monthlyMode.weekdayOfMonth': '每月同一周同一天',
    'desktop.dialog.recurrence.end.never': '永不结束',
    'desktop.dialog.recurrence.end.onDate': '指定结束日期',
    'desktop.dialog.recurrence.end.afterCount': '指定重复次数',

    // Desktop - Recurrence field replacement (detailed edit mode)
    'desktop.recurrenceField.label': '重复设置',
    'desktop.recurrenceField.overrideNotice': '仅此次的日程无法单独编辑重复设置',

    // Desktop - Occurrence scope dialog (recurring events)
    'desktop.dialog.occurrenceScope.title': '这是一个重复日程',
    'desktop.dialog.occurrenceScope.editThis': '仅编辑此次',
    'desktop.dialog.occurrenceScope.deleteThis': '仅删除此次',
    'desktop.dialog.occurrenceScope.editSeries': '编辑整个系列',
    'desktop.dialog.occurrenceScope.deleteSeries': '删除整个系列',
    'desktop.dialog.occurrenceScope.cancel': '取消',

    // Desktop - Toast messages
    'desktop.toast.eventCopied': '事件已复制',
    'desktop.toast.recordDeleted': '记录删除成功',

    // Desktop - Error messages
    'desktop.error.recordSaveFailed': '保存记录失败: {0}',
    'desktop.error.recordFetchFailed': '获取记录失败',
    'desktop.error.recordUpdateFailed': '更新记录失败: {0}',
    'desktop.error.recordDeleteFailed': '删除记录失败: {0}',
    'desktop.error.eventClickFailed': '获取点击事件失败',
    'desktop.error.cannotCopyNewEvent': '无法复制新事件',
    'desktop.error.eventRecordNotFound': '获取事件记录信息失败，请刷新列表后重试。',
    'desktop.error.scheduleRecordNotFound': '此日程无对应记录，请刷新列表后重试。',
    'desktop.error.recurrenceMasterNotFound': '未找到此重复日程的源记录，请刷新列表后重试。',
    'desktop.error.eventCopySuffix': '（副本）',
    'desktop.error.detailedRefreshFailed': '反映记录失败，请刷新列表确认。',

    // Desktop - Detailed edit dialog (kintone standard record screen in iframe)
    'desktop.detailedDialog.createTitle': '添加记录',
    'desktop.detailedDialog.editTitle': '编辑记录',
    'desktop.detailedDialog.loading': '正在加载',

    // Config - Loading
    'config.loading.waitingForRender': '等待屏幕渲染',
    'config.loading.fetchingSettings': '加载设置',

    // Config - Sidebar
    'config.sidebar.notSet': '未设置',
    'config.sidebar.settingLabel': '设置 {0}',

    // Config - Toast messages
    'config.toast.settingDeleted': '设置已删除',
    'config.toast.settingCopied': '设置已复制',
    'config.toast.settingPasted': '设置已粘贴',
    'config.toast.settingInvalidFormat': '设置格式无效',
    'config.toast.conditionDeleted': '条件已删除',
    'config.toast.settingSaved': '设置已保存',
    'config.toast.settingReset': '设置已重置',
    'config.toast.settingImported': '设置已导入',
    'config.toast.settingImportFailed': '导入设置失败，请检查文件是否有误。',
    'config.toast.settingExported': '插件设置已导出',
    'config.toast.settingExportFailed': '导出插件设置失败，请联系插件开发者。',
    'config.toast.viewCreated': '视图已创建',
    'config.toast.viewCreationFailed': '创建视图失败',

    // Config - Error messages
    'config.error.appIdNotFound': '无法获取应用ID',
    'config.error.rootElementNotFound': '插件HTML中不存在根元素。',
    'config.error.fieldInfoNotFound': '无法获取应用字段信息',
    'config.error.viewInfoNotFound': '无法获取应用视图信息',

    // Config - Form section titles
    'config.section.viewSettings.title': '日历显示视图设置',
    'config.section.viewSettings.description': '选择要显示日历的视图',
    'config.section.scheduleTitle.title': '日程标题',
    'config.section.scheduleTitle.description': '选择用作日程标题的字段',
    'config.section.scheduleTitle.description2': '可用字段类型：单行文本、多行文本、富文本',
    'config.section.scheduleStart.title': '日程开始日期/时间',
    'config.section.scheduleStart.description': '选择用作日程开始日期/时间的字段',
    'config.section.scheduleStart.description2': '如果设置"日期"字段，将被视为全天事件',
    'config.section.scheduleEnd.title': '日程结束日期',
    'config.section.scheduleEnd.description': '选择用作日程结束日期的字段',
    'config.section.scheduleEnd.description2': '如果设置"日期"字段，将被视为全天事件',
    'config.section.allDay.title': '全天设置',
    'config.section.allDay.description': '启用不指定时间的全天事件',
    'config.section.allDay.enableLabel': '启用全天设置',
    'config.section.note.title': '日程备注',
    'config.section.note.description': '启用可从日历编辑的日程备注',
    'config.section.note.description2': '可用字段类型：单行文本、多行文本、富文本',
    'config.section.note.enableLabel': '启用日程备注',
    'config.section.recurrence.title': '重复日程',
    'config.section.recurrence.description': '允许从日历创建每周、每月等重复日程',
    'config.section.recurrence.description2':
      '可用字段类型：单行文本、多行文本。此字段保存插件内部数据，请勿在记录列表中直接编辑',
    'config.section.recurrence.enableLabel': '启用重复日程',
    'config.section.editMode.title': '编辑模式',
    'config.section.editMode.description':
      '选择日程的添加、编辑方式。简易编辑使用插件独有的对话框。详细编辑会在对话框中显示kintone标准的记录添加、编辑画面，因此即使设置了必填字段也可以添加日程。详细编辑仅支持电脑版，手机版始终使用简易编辑（如果设置了必填字段，可能无法从手机版添加日程）',
    'config.section.editMode.description2':
      '启用重复日程时，详细编辑会将记录编辑画面上的重复设置字段替换为插件独有的输入界面',
    'config.section.advanced': '高级设置',
    'config.section.initialView.title': '初始日历视图类型',
    'config.section.initialView.description': '选择初始日历视图类型',
    'config.section.slotMinmax.title': '显示时间范围设置',
    'config.section.slotMinmax.description': '设置日历上显示的时间段上下限。',
    'config.section.businessDays.title': '工作日设置',
    'config.section.businessDays.description': '设置一周中哪些天为工作日',
    'config.section.businessDays.description2': '未勾选的日期将在日历上显示为灰色',
    'config.section.firstDay.title': '每周第一天',
    'config.section.firstDay.description': '设置每周的起始日',
    'config.section.firstDay.description2': '此日期将在周视图和月视图中显示在最左侧',
    'config.section.category.title': '类别设置',
    'config.section.category.description': '设置用作日历类别的字段',
    'config.section.category.description2': '日历事件将按类别着色',
    'config.section.category.description3': '可用字段类型：复选框、单选按钮、下拉菜单',
    'config.section.colors.title': '日程颜色',
    'config.section.colors.description': '设置日历日程的颜色。',
    'config.section.colors.description2': '如果不使用类别，日程将始终使用第一个颜色',

    // Config - Form labels
    'config.form.viewName': '视图名称',
    'config.form.calendarType': '日历类型',
    'config.form.slotStart': '开始',
    'config.form.slotEnd': '结束',
    'config.form.hour': '时',
    'config.form.firstDay': '每周第一天',
    'config.form.editMode': '编辑方式',
    'config.form.editMode.simple': '简易编辑（专用对话框）',
    'config.form.editMode.detailed': '详细编辑（kintone标准画面）',
    'config.form.colorLabel': '颜色 {0}',
    'config.form.addColor': '添加颜色设置',
    'config.form.deleteColor': '删除此颜色设置',
    'config.form.allDayValue': '全天值',
    'config.form.selectField': '选择字段',
    'config.form.createNewView': '创建新视图',
    'config.form.calendarName': '📆 日历',

    // Config - Initial view options
    'config.initialView.dayGridMonth': '日网格，1个月日历',
    'config.initialView.timeGridWeek': '时间网格，1周日历',
    'config.initialView.timeGridFiveDay': '时间网格，5天日历',
    'config.initialView.timeGridThreeDay': '时间网格，3天日历',
    'config.initialView.timeGridDay': '时间网格，1天日历',

    // Config - Footer buttons
    'config.footer.save': '保存设置',
    'config.footer.backToPluginList': '返回插件列表',
    'config.footer.backToPluginListShort': '返回插件列表',

    // Desktop/Config - Calendar features
    'desktop.calendar.noPermission': '（无访问权限）',
    'desktop.confirm.ok': '确定',
    'desktop.confirm.cancel': '取消',
    'desktop.confirm.deleteTitle': '删除日程',
    'desktop.confirm.deleteMessage': '要删除“{0}”吗？此操作无法撤销',
    'desktop.confirm.deleteSeriesMessage': '要删除重复日程“{0}”的所有日程吗？此操作无法撤销',
    'desktop.confirm.rescheduleTitle': '更改日程时间',
    'desktop.confirm.rescheduleMessage': '要更改“{0}”的日期和时间吗？',
    'desktop.contextMenu.showDetail': '查看详情',
    'desktop.contextMenu.edit': '编辑',
    'desktop.contextMenu.copy': '复制',
    'desktop.contextMenu.delete': '删除',
    'desktop.contextMenu.changeCategory': '更改颜色（类别）',
    'desktop.dialog.backgroundEvent': '显示为背景',
    'desktop.legend.label': '类别图例',
    'config.firstDay.today': '今天的星期',
    'config.form.displayTitleField': '显示标题字段',
    'config.form.slotDuration': '时间间隔',
    'config.form.minutes': '{0}分钟',
    'config.form.nextDayHour': '次日{0}点',
    'config.form.slotRangeInvalid': '结束时间必须晚于开始时间',
    'config.form.scrollsToNow': '显示时自动滚动到当前时间附近',
    'config.form.enablesDragAndDrop': '允许通过拖放更改日程时间',
    'config.form.confirmsReschedule': '更改时间前进行确认',
    'config.form.preventsOverlap': '禁止日程时间重叠',
    'config.form.showsLegend': '在日历上方显示类别图例',
    'config.form.backgroundEventValue': '作为背景事件的值',
    'config.form.backgroundEventValueRequired': '请选择作为背景事件的值',
    'config.form.sortOrder': '排序',
    'config.form.sortOrder.asc': '升序',
    'config.form.sortOrder.desc': '降序',
    'config.section.displayTitle.title': '显示标题（可选）',
    'config.section.displayTitle.description':
      '请选择在日历上代替日程标题显示的字段。未设置时显示日程标题',
    'config.section.displayTitle.description2':
      '用于显示组合多个项目的标题（如计算字段）。从日历输入的内容仍保存到日程标题字段',
    'config.section.interaction.title': '日程操作',
    'config.section.interaction.description': '设置在日历上通过拖放操作日程的方式',
    'config.section.interaction.description2':
      '禁止重叠仅适用于日历上的拖放和范围选择。与背景事件重叠不受限制',
    'config.section.slotMinmax.description2':
      '将结束设为24点以后，可以在一天的范围内显示夜班等跨日的时间段',
    'config.section.visibleViews.title': '视图切换按钮',
    'config.section.visibleViews.description': '选择显示在日历上方的视图切换按钮',
    'config.section.visibleViews.description2':
      '未选择时显示所有按钮。仅选择一个时不显示切换按钮。在同一标签页中再次显示时，将恢复上次的视图',
    'config.section.backgroundEvent.title': '背景事件',
    'config.section.backgroundEvent.description':
      '将节假日、休息日、工作时间等日程显示为日历背景。可以在背景事件上添加普通日程',
    'config.section.backgroundEvent.description2':
      '仅可使用复选框字段。勾选了指定值的记录将成为背景事件。周视图和日视图中的背景事件不支持右键菜单',
    'config.section.backgroundEvent.enableLabel': '启用背景事件',
    'config.section.sort.title': '日程排序',
    'config.section.sort.description':
      '请选择决定同一时间开始的日程排列顺序的字段。未设置时按标题排序',
    'config.section.sort.description2':
      '可用的字段类型为数值、计算、单行文本、下拉菜单、单选框、日期、日期与时间、时间。下拉菜单和单选框按选项顺序排列',

    // Common - Weekdays
    'common.weekday.sunday': '星期日',
    'common.weekday.monday': '星期一',
    'common.weekday.tuesday': '星期二',
    'common.weekday.wednesday': '星期三',
    'common.weekday.thursday': '星期四',
    'common.weekday.friday': '星期五',
    'common.weekday.saturday': '星期六',

    // Common - Field select
    'common.field.codePrefix': '代码：',
    'common.field.targetField': '目标字段',
    'common.field.selectPlaceholder': '选择字段',

    // Common - Error
    'common.error.pluginError': '插件"{0}"发生错误。',
  },
  'zh-TW': {
    // Desktop - Loading
    'desktop.loading.default': '載入中',

    // Desktop - Calendar view types
    'desktop.calendar.viewType.month': '月',
    'desktop.calendar.viewType.week': '週',
    'desktop.calendar.viewType.fiveDay': '5天',
    'desktop.calendar.viewType.threeDay': '3天',
    'desktop.calendar.viewType.day': '日',
    'desktop.calendar.noTitle': '（無標題）',

    // Desktop - Sidebar
    'desktop.sidebar.filterSchedule': '篩選行程',
    'desktop.sidebar.category': '類別',
    'desktop.sidebar.collapse': '收合側邊欄',
    'desktop.sidebar.expand': '展開側邊欄',

    // Desktop - Fab
    'desktop.fab.addSchedule': '新增行程',

    // Desktop - Dialog
    'desktop.dialog.eventTitle': '事件標題',
    'desktop.dialog.description': '描述',
    'desktop.dialog.startDate': '開始日期',
    'desktop.dialog.startDateTime': '開始日期/時間',
    'desktop.dialog.endDate': '結束日期',
    'desktop.dialog.endDateTime': '結束日期/時間',
    'desktop.dialog.category': '類別',
    'desktop.dialog.allDay': '整天',

    // Desktop - Recurrence input
    'desktop.dialog.recurrence.enable': '重複',
    'desktop.dialog.recurrence.frequency': '頻率',
    'desktop.dialog.recurrence.frequency.daily': '每天',
    'desktop.dialog.recurrence.frequency.weekly': '每週',
    'desktop.dialog.recurrence.frequency.monthly': '每月',
    'desktop.dialog.recurrence.frequency.yearly': '每年',
    'desktop.dialog.recurrence.interval': '間隔',
    'desktop.dialog.recurrence.monthlyMode.dayOfMonth': '每月同一天',
    'desktop.dialog.recurrence.monthlyMode.weekdayOfMonth': '每月同一週同一天',
    'desktop.dialog.recurrence.end.never': '永不結束',
    'desktop.dialog.recurrence.end.onDate': '指定結束日期',
    'desktop.dialog.recurrence.end.afterCount': '指定重複次數',

    // Desktop - Recurrence field replacement (detailed edit mode)
    'desktop.recurrenceField.label': '重複設定',
    'desktop.recurrenceField.overrideNotice': '僅此次的行程無法單獨編輯重複設定',

    // Desktop - Occurrence scope dialog (recurring events)
    'desktop.dialog.occurrenceScope.title': '這是一個重複行程',
    'desktop.dialog.occurrenceScope.editThis': '僅編輯此次',
    'desktop.dialog.occurrenceScope.deleteThis': '僅刪除此次',
    'desktop.dialog.occurrenceScope.editSeries': '編輯整個系列',
    'desktop.dialog.occurrenceScope.deleteSeries': '刪除整個系列',
    'desktop.dialog.occurrenceScope.cancel': '取消',

    // Desktop - Toast messages
    'desktop.toast.eventCopied': '事件已複製',
    'desktop.toast.recordDeleted': '記錄刪除成功',

    // Desktop - Error messages
    'desktop.error.recordSaveFailed': '儲存記錄失敗：{0}',
    'desktop.error.recordFetchFailed': '取得記錄失敗',
    'desktop.error.recordUpdateFailed': '更新記錄失敗：{0}',
    'desktop.error.recordDeleteFailed': '刪除記錄失敗：{0}',
    'desktop.error.eventClickFailed': '取得點擊事件失敗',
    'desktop.error.cannotCopyNewEvent': '無法複製新事件',
    'desktop.error.eventRecordNotFound': '取得事件記錄資訊失敗，請重新整理列表後再試。',
    'desktop.error.scheduleRecordNotFound': '此行程無對應記錄，請重新整理列表後再試。',
    'desktop.error.recurrenceMasterNotFound': '找不到此重複行程的來源記錄，請重新整理列表後再試。',
    'desktop.error.eventCopySuffix': '（副本）',
    'desktop.error.detailedRefreshFailed': '反映記錄失敗，請重新整理列表確認。',

    // Desktop - Detailed edit dialog (kintone standard record screen in iframe)
    'desktop.detailedDialog.createTitle': '新增記錄',
    'desktop.detailedDialog.editTitle': '編輯記錄',
    'desktop.detailedDialog.loading': '載入中',

    // Config - Loading
    'config.loading.waitingForRender': '等待畫面渲染',
    'config.loading.fetchingSettings': '載入設定',

    // Config - Sidebar
    'config.sidebar.notSet': '未設定',
    'config.sidebar.settingLabel': '設定 {0}',

    // Config - Toast messages
    'config.toast.settingDeleted': '設定已刪除',
    'config.toast.settingCopied': '設定已複製',
    'config.toast.settingPasted': '設定已貼上',
    'config.toast.settingInvalidFormat': '設定格式無效',
    'config.toast.conditionDeleted': '條件已刪除',
    'config.toast.settingSaved': '設定已儲存',
    'config.toast.settingReset': '設定已重設',
    'config.toast.settingImported': '設定已匯入',
    'config.toast.settingImportFailed': '匯入設定失敗，請檢查檔案是否有誤。',
    'config.toast.settingExported': '外掛設定已匯出',
    'config.toast.settingExportFailed': '匯出外掛設定失敗，請聯繫外掛開發者。',
    'config.toast.viewCreated': '檢視已建立',
    'config.toast.viewCreationFailed': '建立檢視失敗',

    // Config - Error messages
    'config.error.appIdNotFound': '無法取得應用程式ID',
    'config.error.rootElementNotFound': '外掛HTML中不存在根元素。',
    'config.error.fieldInfoNotFound': '無法取得應用程式欄位資訊',
    'config.error.viewInfoNotFound': '無法取得應用程式檢視資訊',

    // Config - Form section titles
    'config.section.viewSettings.title': '行事曆顯示檢視設定',
    'config.section.viewSettings.description': '選擇要顯示行事曆的檢視',
    'config.section.scheduleTitle.title': '行程標題',
    'config.section.scheduleTitle.description': '選擇用作行程標題的欄位',
    'config.section.scheduleTitle.description2': '可用欄位類型：單行文字、多行文字、富文字',
    'config.section.scheduleStart.title': '行程開始日期/時間',
    'config.section.scheduleStart.description': '選擇用作行程開始日期/時間的欄位',
    'config.section.scheduleStart.description2': '如果設定「日期」欄位，將被視為整天事件',
    'config.section.scheduleEnd.title': '行程結束日期',
    'config.section.scheduleEnd.description': '選擇用作行程結束日期的欄位',
    'config.section.scheduleEnd.description2': '如果設定「日期」欄位，將被視為整天事件',
    'config.section.allDay.title': '整天設定',
    'config.section.allDay.description': '啟用不指定時間的整天事件',
    'config.section.allDay.enableLabel': '啟用整天設定',
    'config.section.note.title': '行程備註',
    'config.section.note.description': '啟用可從行事曆編輯的行程備註',
    'config.section.note.description2': '可用欄位類型：單行文字、多行文字、富文字',
    'config.section.note.enableLabel': '啟用行程備註',
    'config.section.recurrence.title': '重複行程',
    'config.section.recurrence.description': '允許從行事曆建立每週、每月等重複行程',
    'config.section.recurrence.description2':
      '可用欄位類型：單行文字、多行文字。此欄位保存外掛內部資料，請勿在記錄清單中直接編輯',
    'config.section.recurrence.enableLabel': '啟用重複行程',
    'config.section.editMode.title': '編輯模式',
    'config.section.editMode.description':
      '選擇行程的新增、編輯方式。簡易編輯使用外掛獨有的對話方塊。詳細編輯會在對話方塊中顯示kintone標準的記錄新增、編輯畫面，因此即使設定了必填欄位也可以新增行程。詳細編輯僅支援電腦版，手機版一律使用簡易編輯（若設定了必填欄位，可能無法從手機版新增行程）',
    'config.section.editMode.description2':
      '啟用重複行程時，詳細編輯會將記錄編輯畫面上的重複設定欄位替換為外掛獨有的輸入介面',
    'config.section.advanced': '進階設定',
    'config.section.initialView.title': '初始行事曆檢視類型',
    'config.section.initialView.description': '選擇初始行事曆檢視類型',
    'config.section.slotMinmax.title': '顯示時間範圍設定',
    'config.section.slotMinmax.description': '設定行事曆上顯示的時段上下限。',
    'config.section.businessDays.title': '工作日設定',
    'config.section.businessDays.description': '設定一週中哪些天為工作日',
    'config.section.businessDays.description2': '未勾選的日期將在行事曆上顯示為灰色',
    'config.section.firstDay.title': '每週第一天',
    'config.section.firstDay.description': '設定每週的起始日',
    'config.section.firstDay.description2': '此日期將在週檢視和月檢視中顯示在最左側',
    'config.section.category.title': '類別設定',
    'config.section.category.description': '設定用作行事曆類別的欄位',
    'config.section.category.description2': '行事曆事件將按類別著色',
    'config.section.category.description3': '可用欄位類型：核取方塊、選項按鈕、下拉式選單',
    'config.section.colors.title': '行程顏色',
    'config.section.colors.description': '設定行事曆行程的顏色。',
    'config.section.colors.description2': '如果不使用類別，行程將始終使用第一個顏色',

    // Config - Form labels
    'config.form.viewName': '檢視名稱',
    'config.form.calendarType': '行事曆類型',
    'config.form.slotStart': '開始',
    'config.form.slotEnd': '結束',
    'config.form.hour': '時',
    'config.form.firstDay': '每週第一天',
    'config.form.editMode': '編輯方式',
    'config.form.editMode.simple': '簡易編輯（專用對話方塊）',
    'config.form.editMode.detailed': '詳細編輯（kintone標準畫面）',
    'config.form.colorLabel': '顏色 {0}',
    'config.form.addColor': '新增顏色設定',
    'config.form.deleteColor': '刪除此顏色設定',
    'config.form.allDayValue': '整天值',
    'config.form.selectField': '選擇欄位',
    'config.form.createNewView': '建立新檢視',
    'config.form.calendarName': '📆 行事曆',

    // Config - Initial view options
    'config.initialView.dayGridMonth': '日網格，1個月行事曆',
    'config.initialView.timeGridWeek': '時間網格，1週行事曆',
    'config.initialView.timeGridFiveDay': '時間網格，5天行事曆',
    'config.initialView.timeGridThreeDay': '時間網格，3天行事曆',
    'config.initialView.timeGridDay': '時間網格，1天行事曆',

    // Config - Footer buttons
    'config.footer.save': '儲存設定',
    'config.footer.backToPluginList': '返回外掛列表',
    'config.footer.backToPluginListShort': '返回外掛列表',

    // Desktop/Config - Calendar features
    'desktop.calendar.noPermission': '（無存取權限）',
    'desktop.confirm.ok': '確定',
    'desktop.confirm.cancel': '取消',
    'desktop.confirm.deleteTitle': '刪除行程',
    'desktop.confirm.deleteMessage': '要刪除「{0}」嗎？此操作無法復原',
    'desktop.confirm.deleteSeriesMessage': '要刪除重複行程「{0}」的所有行程嗎？此操作無法復原',
    'desktop.confirm.rescheduleTitle': '變更行程時間',
    'desktop.confirm.rescheduleMessage': '要變更「{0}」的日期和時間嗎？',
    'desktop.contextMenu.showDetail': '檢視詳細資料',
    'desktop.contextMenu.edit': '編輯',
    'desktop.contextMenu.copy': '複製',
    'desktop.contextMenu.delete': '刪除',
    'desktop.contextMenu.changeCategory': '變更顏色（類別）',
    'desktop.dialog.backgroundEvent': '顯示為背景',
    'desktop.legend.label': '類別圖例',
    'config.firstDay.today': '今天的星期',
    'config.form.displayTitleField': '顯示標題欄位',
    'config.form.slotDuration': '時間間隔',
    'config.form.minutes': '{0}分鐘',
    'config.form.nextDayHour': '隔天{0}點',
    'config.form.slotRangeInvalid': '結束時間必須晚於開始時間',
    'config.form.scrollsToNow': '顯示時自動捲動到目前時間附近',
    'config.form.enablesDragAndDrop': '允許透過拖放變更行程時間',
    'config.form.confirmsReschedule': '變更時間前進行確認',
    'config.form.preventsOverlap': '禁止行程時間重疊',
    'config.form.showsLegend': '在行事曆上方顯示類別圖例',
    'config.form.backgroundEventValue': '作為背景事件的值',
    'config.form.backgroundEventValueRequired': '請選擇作為背景事件的值',
    'config.form.sortOrder': '排序',
    'config.form.sortOrder.asc': '升冪',
    'config.form.sortOrder.desc': '降冪',
    'config.section.displayTitle.title': '顯示標題（選填）',
    'config.section.displayTitle.description':
      '請選擇在行事曆上代替行程標題顯示的欄位。未設定時顯示行程標題',
    'config.section.displayTitle.description2':
      '用於顯示組合多個項目的標題（如計算欄位）。從行事曆輸入的內容仍儲存到行程標題欄位',
    'config.section.interaction.title': '行程操作',
    'config.section.interaction.description': '設定在行事曆上透過拖放操作行程的方式',
    'config.section.interaction.description2':
      '禁止重疊僅適用於行事曆上的拖放和範圍選擇。與背景事件重疊不受限制',
    'config.section.slotMinmax.description2':
      '將結束設為24點以後，可以在一天的範圍內顯示夜班等跨日的時段',
    'config.section.visibleViews.title': '檢視切換按鈕',
    'config.section.visibleViews.description': '選擇顯示在行事曆上方的檢視切換按鈕',
    'config.section.visibleViews.description2':
      '未選擇時顯示所有按鈕。僅選擇一個時不顯示切換按鈕。在同一分頁中再次顯示時，將還原上次的檢視',
    'config.section.backgroundEvent.title': '背景事件',
    'config.section.backgroundEvent.description':
      '將假日、休息日、工作時段等行程顯示為行事曆背景。可以在背景事件上新增一般行程',
    'config.section.backgroundEvent.description2':
      '僅可使用核取方塊欄位。勾選了指定值的記錄將成為背景事件。週檢視和日檢視中的背景事件不支援右鍵選單',
    'config.section.backgroundEvent.enableLabel': '啟用背景事件',
    'config.section.sort.title': '行程排序',
    'config.section.sort.description':
      '請選擇決定同一時間開始的行程排列順序的欄位。未設定時依標題排序',
    'config.section.sort.description2':
      '可用的欄位類型為數值、計算、單行文字、下拉式選單、選項按鈕、日期、日期與時間、時間。下拉式選單和選項按鈕依選項順序排列',

    // Common - Weekdays
    'common.weekday.sunday': '星期日',
    'common.weekday.monday': '星期一',
    'common.weekday.tuesday': '星期二',
    'common.weekday.wednesday': '星期三',
    'common.weekday.thursday': '星期四',
    'common.weekday.friday': '星期五',
    'common.weekday.saturday': '星期六',

    // Common - Field select
    'common.field.codePrefix': '代碼：',
    'common.field.targetField': '目標欄位',
    'common.field.selectPlaceholder': '選擇欄位',

    // Common - Error
    'common.error.pluginError': '外掛「{0}」發生錯誤。',
  },
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});

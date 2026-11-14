/**
 * チャットからの書き込み(承認カード・プレビュー)の文言
 *
 * `i18n.ts`が大きくなりすぎるため分けた。`i18n.ts`でマージする
 *
 * @see docs/06-ui.md 6章、docs/07-ai-tools.md 5章
 */
export const chatWriteUi = {
  ja: {
    'desktop.chat.tool.preview_css': 'CSSをプレビュー',
    'desktop.chat.tool.write_asset': 'カスタマイズを登録・更新',
    'desktop.chat.tool.set_asset_state': 'カスタマイズの状態を変更',
    'desktop.chat.tool.delete_asset': 'カスタマイズを削除',
    'desktop.chat.tool.status.deniedWrite': '却下した',
    'desktop.chat.tool.status.rejected': '保存されなかった',
    'desktop.chat.empty.write':
      '保存・変更・削除は、毎回あなたが承認してから行います。新しいJavaScriptは無効の状態で保存されます。',
    'desktop.chat.preview.active': 'CSSをプレビュー中です(保存されていません)',
    'desktop.chat.preview.clear': 'プレビューを解除',
    'desktop.chat.write.titleCreate': 'このカスタマイズを登録してよいですか',
    'desktop.chat.write.titleUpdate': 'このカスタマイズを更新してよいですか',
    'desktop.chat.write.subject': '{0}「{1}」',
    'desktop.chat.write.subjectUpdate': '{0}「{1}」(#{2})',
    'desktop.chat.write.kind.js': 'JavaScript',
    'desktop.chat.write.kind.css': 'CSS',
    'desktop.chat.write.description': '説明: {0}',
    'desktop.chat.write.screens': '適用画面: {0}',
    'desktop.chat.write.code': '保存するコード',
    'desktop.chat.write.diff': '既存のコードとの差分(+{0}行 / -{1}行)',
    'desktop.chat.write.diffLabel': '既存のコードとの差分',
    'desktop.chat.write.noCodeChange': 'コードは変わりません',
    'desktop.chat.write.scope': '影響範囲',
    'desktop.chat.write.noPublish': '「全員」に公開する権限がありません',
    'desktop.chat.write.requestedPublic': 'AIは「全員」を指定しています',
    'desktop.chat.write.enableAfterSave': '保存後すぐ有効にする',
    'desktop.chat.write.jsDisabled':
      'JavaScriptは無効の状態で保存します。内容を確かめてから一覧で有効にし、画面を再読み込みしてください。',
    'desktop.chat.write.keepsState': '有効・無効は今のまま({0})です。',
    'desktop.chat.write.reloadAfterSave':
      '有効なJavaScriptの変更は、画面を再読み込みすると反映されます。',
    'desktop.chat.write.permissions': '書き込み権限(外すと、その操作は実行時に拒否されます)',
    'desktop.chat.write.noPermissions': '書き込み権限: なし(レコードの読み取りだけ)',
    'desktop.chat.write.usedAt': '使用箇所: {0}',
    'desktop.chat.write.unused': 'コードで使っていません',
    'desktop.chat.write.newGrant': '新しく付与',
    'desktop.chat.write.currentPermissions': '付与されている権限: {0}',
    'desktop.chat.write.willBeDenied': 'この操作は実行時に拒否されます',
    'desktop.chat.write.externalUrls': '外部通信の送信先(外すと、その送信先への通信は拒否されます)',
    'desktop.chat.write.blockers':
      'このままでは保存できません。承認すると、理由をAIへ返して直させます。',
    'desktop.chat.write.blocker.humanOnly':
      '人が付けた強い権限(制限なし・外部通信すべて)があるため、AIからは変更できません。詳細画面で変更してください。',
    'desktop.chat.write.blocker.stale':
      '一覧で見ている版と違います。他の人が更新した可能性があります。',
    'desktop.chat.write.blocker.notFound': '一覧にありません(読めないか、削除されています)。',
    'desktop.chat.write.blocker.code': 'コードに問題があります: {0}',
    'desktop.chat.write.warnings': '確かめてください',
    'desktop.chat.write.warning.unused-permission':
      '「{0}」はコードで使っていません。外すことをおすすめします。',
    'desktop.chat.write.warning.unused-external-url': '送信先 {0} はコードで使っていません。',
    'desktop.chat.write.warning.dynamic-api':
      '{0}: 操作の種類(追加・更新・削除)を実行時に判定します。',
    'desktop.chat.write.warning.dynamic-external':
      '{0}: 送信先を実行時に決めます。送信先が正しいか確かめてください。',
    'desktop.chat.write.warning.bulk-operation':
      '{0}: 複数のレコードをまとめて変更します。影響する件数に注意してください。',
    'desktop.chat.write.warning.credential':
      '{0}: 認証情報らしき文字列があります。コードに認証情報を書かないでください。',
    'desktop.chat.write.warning.insecure-external-url': '{0} は暗号化されない http: の通信です。',
    'desktop.chat.write.preview': 'プレビュー',
    'desktop.chat.write.approveCreate': '登録する',
    'desktop.chat.write.approveUpdate': '更新する',
    'desktop.chat.write.deny': '却下',
    'desktop.chat.write.reason': '却下の理由(任意。AIに伝えます)',
    'desktop.chat.state.title': 'このカスタマイズを変更してよいですか',
    'desktop.chat.state.enabled': '状態: {0} → {1}',
    'desktop.chat.state.scope': '影響範囲: {0} → {1}',
    'desktop.chat.state.order': '実行順: {0} → {1}',
    'desktop.chat.state.permissions': '書き込み権限: {0} → {1}',
    'desktop.chat.state.externalUrls': '送信先: {0} → {1}',
    'desktop.chat.state.none': 'なし',
    'desktop.chat.state.on': '有効',
    'desktop.chat.state.off': '無効',
    'desktop.chat.state.approve': '変更する',
    'desktop.chat.delete.title': 'このカスタマイズを削除してよいですか',
    'desktop.chat.delete.body': '「{0}」(#{1})を削除します。取り消せません。',
    'desktop.chat.delete.reason': 'AIが示した理由: {0}',
    'desktop.chat.delete.approve': '削除する',
    'desktop.chat.delete.disableInstead': '代わりに無効にする',
    'desktop.chat.delete.disableInsteadReason':
      '利用者は削除ではなく無効化を選びました。set_asset_state で enabled: false にしてください。',
  },
  en: {
    'desktop.chat.tool.preview_css': 'Preview CSS',
    'desktop.chat.tool.write_asset': 'Save a customization',
    'desktop.chat.tool.set_asset_state': 'Change a customization',
    'desktop.chat.tool.delete_asset': 'Delete a customization',
    'desktop.chat.tool.status.deniedWrite': 'Rejected',
    'desktop.chat.tool.status.rejected': 'Not saved',
    'desktop.chat.empty.write':
      'Saving, changing, and deleting always wait for your approval. New JavaScript is saved disabled.',
    'desktop.chat.preview.active': 'Previewing CSS (not saved)',
    'desktop.chat.preview.clear': 'Stop preview',
    'desktop.chat.write.titleCreate': 'Save this customization?',
    'desktop.chat.write.titleUpdate': 'Update this customization?',
    'desktop.chat.write.subject': '{0} "{1}"',
    'desktop.chat.write.subjectUpdate': '{0} "{1}" (#{2})',
    'desktop.chat.write.kind.js': 'JavaScript',
    'desktop.chat.write.kind.css': 'CSS',
    'desktop.chat.write.description': 'Description: {0}',
    'desktop.chat.write.screens': 'Screens: {0}',
    'desktop.chat.write.code': 'Code to save',
    'desktop.chat.write.diff': 'Changes from the current code (+{0} / -{1} lines)',
    'desktop.chat.write.diffLabel': 'Changes from the current code',
    'desktop.chat.write.noCodeChange': 'The code does not change',
    'desktop.chat.write.scope': 'Applies to',
    'desktop.chat.write.noPublish': 'You are not allowed to publish to everyone',
    'desktop.chat.write.requestedPublic': 'The AI asked for "Everyone"',
    'desktop.chat.write.enableAfterSave': 'Enable right after saving',
    'desktop.chat.write.jsDisabled':
      'JavaScript is saved disabled. Review it, enable it in the list, and reload the page.',
    'desktop.chat.write.keepsState': 'Enabled/disabled stays as it is ({0}).',
    'desktop.chat.write.reloadAfterSave':
      'Changes to enabled JavaScript take effect after reloading.',
    'desktop.chat.write.permissions':
      'Write permissions (unchecked operations are blocked at run time)',
    'desktop.chat.write.noPermissions': 'Write permissions: none (reads records only)',
    'desktop.chat.write.usedAt': 'Used at: {0}',
    'desktop.chat.write.unused': 'Not used by the code',
    'desktop.chat.write.newGrant': 'newly granted',
    'desktop.chat.write.currentPermissions': 'Granted permissions: {0}',
    'desktop.chat.write.willBeDenied': 'This operation will be blocked at run time',
    'desktop.chat.write.externalUrls': 'External destinations (unchecked destinations are blocked)',
    'desktop.chat.write.blockers':
      'This cannot be saved as is. If you approve, the reason is sent back to the AI to fix.',
    'desktop.chat.write.blocker.humanOnly':
      'It has strong permissions granted by a person (unrestricted / any external destination), so the AI cannot change it. Change it on the detail screen.',
    'desktop.chat.write.blocker.stale':
      'It differs from the version in the list. Someone may have updated it.',
    'desktop.chat.write.blocker.notFound': 'Not in the list (not readable or deleted).',
    'desktop.chat.write.blocker.code': 'The code has a problem: {0}',
    'desktop.chat.write.warnings': 'Please check',
    'desktop.chat.write.warning.unused-permission':
      '"{0}" is not used by the code. Consider removing it.',
    'desktop.chat.write.warning.unused-external-url': 'Destination {0} is not used by the code.',
    'desktop.chat.write.warning.dynamic-api':
      '{0}: the operation (create/update/delete) is decided at run time.',
    'desktop.chat.write.warning.dynamic-external':
      '{0}: the destination is decided at run time. Check that the destinations are right.',
    'desktop.chat.write.warning.bulk-operation':
      '{0}: changes many records at once. Mind how many records are affected.',
    'desktop.chat.write.warning.credential':
      '{0}: looks like a credential. Do not put credentials in code.',
    'desktop.chat.write.warning.insecure-external-url': '{0} uses unencrypted http:.',
    'desktop.chat.write.preview': 'Preview',
    'desktop.chat.write.approveCreate': 'Save',
    'desktop.chat.write.approveUpdate': 'Update',
    'desktop.chat.write.deny': 'Reject',
    'desktop.chat.write.reason': 'Reason for rejecting (optional, sent to the AI)',
    'desktop.chat.state.title': 'Change this customization?',
    'desktop.chat.state.enabled': 'Status: {0} → {1}',
    'desktop.chat.state.scope': 'Applies to: {0} → {1}',
    'desktop.chat.state.order': 'Order: {0} → {1}',
    'desktop.chat.state.permissions': 'Write permissions: {0} → {1}',
    'desktop.chat.state.externalUrls': 'Destinations: {0} → {1}',
    'desktop.chat.state.none': 'None',
    'desktop.chat.state.on': 'Enabled',
    'desktop.chat.state.off': 'Disabled',
    'desktop.chat.state.approve': 'Change',
    'desktop.chat.delete.title': 'Delete this customization?',
    'desktop.chat.delete.body': 'Deletes "{0}" (#{1}). This cannot be undone.',
    'desktop.chat.delete.reason': 'Reason given by the AI: {0}',
    'desktop.chat.delete.approve': 'Delete',
    'desktop.chat.delete.disableInstead': 'Disable instead',
    'desktop.chat.delete.disableInsteadReason':
      'The user chose to disable it instead of deleting it. Use set_asset_state with enabled: false.',
  },
} as const;

import config from 'plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

export const RULE_TYPES = [
  { key: 'always', label: '常に' },
  { key: 'equal', label: '=（等しい）' },
  { key: 'notEqual', label: '≠ （等しくない）' },
  { key: 'includes', label: '次のキーワードを含む' },
  { key: 'notIncludes', label: '次のキーワードを含まない' },
  { key: 'greater', label: '≧ （以上）' },
  { key: 'less', label: '≦ （以下）' },
  { key: 'empty', label: '未入力の場合' },
  { key: 'full', label: '入力がある場合' },
] as const;

export type RuleTypeKey = (typeof RULE_TYPES)[number]['key'];

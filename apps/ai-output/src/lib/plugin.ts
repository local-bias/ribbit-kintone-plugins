import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  LatestPluginConditionSchema,
  type PluginCondition,
  type PluginConfig,
} from '@/schema/plugin-config';
import { isProd, PLUGIN_ID } from './global';

export const isPluginConditionMet = (condition: unknown): boolean => {
  return LatestPluginConditionSchema.safeParse(condition).success;
};

export const isUsagePluginConditionMet = (condition: PluginCondition) => {
  return condition.outputFields.length > 0 && condition.outputFields.some((f) => !!f.fieldCode);
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  memo: '',
  aiModel: 'gpt-4o',
  systemPrompt: '',
  outputFields: [{ fieldCode: '', description: '' }],
  buttonLabel: 'AI自動入力を実行',
  executionTiming: 'manual',
  spaceFieldId: '',
  temperature: 0.7,
  maxExternalRecords: 100,
  apiTimeout: 60,
});

export const createConfig = (): PluginConfig => ({
  version: 2,
  common: {},
  conditions: [getNewCondition()],
});

export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case undefined: {
      return migrateConfig({ ...anyConfig, version: 1 });
    }
    case 1: {
      return migrateConfig({
        version: 2,
        common: anyConfig.common,
        conditions: anyConfig.conditions.map((c) => ({
          ...c,
          outputFields: c.outputFields.map((f) => ({
            fieldCode: f.fieldCode,
            description: f.description,
          })),
          spaceFieldId: '',
        })),
      });
    }
    case 2:
    default: {
      return anyConfig;
    }
  }
};

export const restorePluginConfig = (): PluginConfig => {
  const config = restore<AnyPluginConfig>(PLUGIN_ID, { debug: !isProd }) ?? createConfig();
  return migrateConfig(config);
};

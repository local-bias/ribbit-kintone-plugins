import { createStore, Provider } from 'jotai';
import { FC, useMemo } from 'react';

import Input from './components/input';
import Layout from './components/layout';
import Observer from './components/observer';
import Tag from './components/tag';
import { useTagsInitializer } from './hooks/use-tags-initializer';
import { pluginConditionAtom, tagDataAtom } from './states/plugin';

type Props = {
  condition: Plugin.Condition;
  initialValue: Plugin.TagData;
  width?: number;
};

/** タグ初期化フックを呼び出すラッパーコンポーネント（サジェスト有効時のみ） */
const TagsInitializer: FC<{ enabled: boolean }> = ({ enabled }) => {
  useTagsInitializer(enabled);
  return null;
};

const Component: FC<Props> = ({ condition, initialValue, width }) => {
  const store = useMemo(() => {
    const s = createStore();
    s.set(pluginConditionAtom, condition);
    s.set(tagDataAtom, initialValue);
    return s;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enableSuggestion = condition.enableSuggestion ?? false;

  return (
    <Provider store={store}>
      <TagsInitializer enabled={enableSuggestion} />
      <Observer />
      <Layout>
        <Input width={width || 0} enableSuggestion={enableSuggestion} />
        <Tag />
      </Layout>
    </Provider>
  );
};

export default Component;

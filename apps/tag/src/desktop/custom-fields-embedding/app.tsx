import { createStore, Provider } from 'jotai';
import { FC, useMemo } from 'react';

import Input from './components/input';
import Layout from './components/layout';
import Observer from './components/observer';
import Tag from './components/tag';
import { pluginConditionAtom, tagDataAtom } from './states/plugin';

type Props = {
  condition: Plugin.Condition;
  initialValue: Plugin.TagData;
  width?: number;
};

const Component: FC<Props> = ({ condition, initialValue, width }) => {
  const store = useMemo(() => {
    const s = createStore();
    s.set(pluginConditionAtom, condition);
    s.set(tagDataAtom, initialValue);
    return s;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Provider store={store}>
      <Observer />
      <Layout>
        <Input width={width || 0} />
        <Tag />
      </Layout>
    </Provider>
  );
};

export default Component;

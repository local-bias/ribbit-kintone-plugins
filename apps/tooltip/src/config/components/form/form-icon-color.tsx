import { conditionIconColorAtom, conditionTypeAtom } from '@/config/states/plugin';
import { JotaiColorPicker } from '@/lib/components/jotai-color-picker';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';

const Container = () => {
  const type = useAtomValue(conditionTypeAtom);
  if (type !== 'icon') {
    return null;
  }
  return (
    <PluginFormSection>
      <PluginFormTitle>アイコンの色</PluginFormTitle>
      <PluginFormDescription last>
        アイコンの色を指定してください。色は16進数のカラーコードで指定することもできます。
      </PluginFormDescription>
      <JotaiColorPicker
        atom={conditionIconColorAtom}
        label='アイコンの色'
        variant='outlined'
        color='primary'
      />
    </PluginFormSection>
  );
};

export default Container;

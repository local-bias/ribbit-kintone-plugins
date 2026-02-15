import { conditionAllowQuickRepliesAtom } from '@/config/states/plugin';
import { PluginFormDescription, PluginFormTitle } from '@konomi-app/kintone-utilities-react';
import { Switch } from '@mui/material';
import { useAtom } from 'jotai';

export default function QuickRepliesToggle() {
  const [allowQuickReplies, setAllowQuickReplies] = useAtom(conditionAllowQuickRepliesAtom);

  return (
    <>
      <PluginFormTitle>クイックリプライ</PluginFormTitle>
      <PluginFormDescription>
        AIがユーザーの質問の意図を明確にするために選択肢を提示する機能を有効にします。
      </PluginFormDescription>
      <PluginFormDescription last>
        有効にすると、曖昧な質問に対してワンクリックで選択できるボタンが表示されます。
      </PluginFormDescription>
      <Switch
        checked={allowQuickReplies}
        onChange={(e) => setAllowQuickReplies(e.target.checked)}
      />
    </>
  );
}

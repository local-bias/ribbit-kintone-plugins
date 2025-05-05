import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FC } from 'react';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle></PluginFormTitle>
      <PluginFormDescription last></PluginFormDescription>
    </PluginFormSection>
  </div>
);

export default Component;

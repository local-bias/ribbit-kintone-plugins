import styled from '@emotion/styled';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FCX } from 'react';
import HeadingsForm from './form-headings';
import MaxWidthForm from './form-max-width';
import TocTitleForm from './form-toc-title';
import TypeForm from './form-type';

const FormContainer: FCX = ({ className }) => {
  return (
    <div {...{ className }}>
      <PluginFormSection>
        <PluginFormTitle>表示タイプ</PluginFormTitle>
        <PluginFormDescription last>目次をどのように表示するのかを設定します</PluginFormDescription>
        <TypeForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>目次のタイトル</PluginFormTitle>
        <PluginFormDescription last>目次のタイトルを設定します。</PluginFormDescription>
        <TocTitleForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>目次の幅の最大値</PluginFormTitle>
        <PluginFormDescription>許容する目次の幅の最大値を設定してください。</PluginFormDescription>
        <PluginFormDescription last>
          目次の幅は、設定した最大値を超えないように自動的に調整されます。
        </PluginFormDescription>
        <MaxWidthForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>目次設定</PluginFormTitle>
        <PluginFormDescription>目次に表示する見出しを設定します。</PluginFormDescription>
        <PluginFormDescription last>
          対象となるスペースIDと、表示する見出しのラベルを入力してください。
        </PluginFormDescription>
        <HeadingsForm />
      </PluginFormSection>
    </div>
  );
};

const StyledFormContainer = styled(FormContainer)`
  padding: 0 16px;
  > div {
    padding: 8px 8px 8px 16px;
    > h3 {
      font-weight: 500;
      margin-bottom: 16px;
    }
  }
`;

export default StyledFormContainer;

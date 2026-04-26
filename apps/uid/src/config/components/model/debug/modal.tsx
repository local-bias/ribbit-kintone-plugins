import styled from '@emotion/styled';
import BugReportIcon from '@mui/icons-material/BugReport';
import { Fab, Tooltip } from '@mui/material';
import { useAtomValue } from 'jotai';
import React, { type FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { pluginConfigAtom } from '@/config/states/plugin';

const ModalHeading = styled.h2`
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
`;

const ModalPre = styled.pre`
  background-color: #1f2937;
  color: #f9fafb;
  padding: 16px;
  max-height: 40vh;
  overflow: auto;
`;

const DebugTrigger = styled(DialogTrigger)`
  position: fixed !important;
  left: 16px;
  bottom: 16px;
`;

const Content: FC = () => {
  const pluginConfig = useAtomValue(pluginConfigAtom);

  return (
    <div>
      <ModalHeading>Plugin Config</ModalHeading>
      <ModalPre>{JSON.stringify(pluginConfig, null, 2)}</ModalPre>
    </div>
  );
};

const Component: FC = () => (
  <Dialog>
    <DebugTrigger asChild>
      <Tooltip title='デバッグ'>
        <Fab color='inherit' size='small'>
          <BugReportIcon />
        </Fab>
      </Tooltip>
    </DebugTrigger>
    <DialogContent>
      <DialogTitle>Debug</DialogTitle>
      <DialogDescription>この画面は開発時のみ表示されます。</DialogDescription>
      <Content />
    </DialogContent>
  </Dialog>
);

export default Component;

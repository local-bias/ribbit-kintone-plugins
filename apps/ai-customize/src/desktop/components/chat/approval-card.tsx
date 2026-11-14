import { Alert, Button, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { loadable } from '@repo/jotai/utils';
import { type MouseEvent, useEffect, useState } from 'react';
import { detectScreen } from '@/lib/ai/chat-availability';
import type { PendingApproval } from '@/lib/ai/chat-session';
import { DEFAULT_RECORD_SAMPLE_LIMIT } from '@/lib/ai/limits';
import { t } from '@/lib/i18n';
import { cssPreview } from '../../chat/css-preview';
import { decideApprovalAtom } from '../../states/chat';
import { panelAssetsAtom } from '../../states/launcher';
import { assetTitle } from '../asset-labels';
import { isTrustedEvent } from '../use-edit-action';
import { DeleteApprovalCard, StateApprovalCard } from './state-approval-card';
import { toolLabel } from './tool-call-card';
import { WriteApprovalCard } from './write-approval-card';

const panelAssetsLoadableAtom = loadable(panelAssetsAtom);

const encoder = new TextEncoder();

const formatBytes = (bytes: number): string =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

type Description = {
  text: string;
  /** 送る対象を確かめられるまで(一覧の読み込み中)は承認させない */
  ready: boolean;
};

/** 承認カードの説明(何を・どこへ送るか)。値そのものは取得前なので出せない(承認前に取得しない) */
const useDescription = (approval: PendingApproval, destination: string): Description => {
  const assets = useAtomValue(panelAssetsLoadableAtom);
  const input = (approval.input ?? {}) as { id?: unknown; fields?: unknown; limit?: unknown };
  if (approval.toolName === 'read_asset') {
    const id = String(input.id ?? '');
    if (assets.state === 'loading') {
      return { text: t('desktop.panel.loading'), ready: false };
    }
    const asset =
      assets.state === 'hasData'
        ? assets.data.find((item) => item.asset.id === id)?.asset
        : undefined;
    if (asset === undefined) {
      // 一覧に無いものは読めない(実行時に再認可して拒否される)ため、送られるものは無い
      return { text: t('desktop.chat.approval.readAssetUnknown', id, destination), ready: true };
    }
    return {
      text: t(
        'desktop.chat.approval.readAsset',
        assetTitle(asset),
        asset.id,
        t(asset.scope === 'public' ? 'desktop.row.scope.public' : 'desktop.row.scope.private'),
        formatBytes(encoder.encode(asset.code).length),
        destination
      ),
      ready: true,
    };
  }
  if (approval.toolName === 'get_record_sample') {
    const fields = Array.isArray(input.fields) ? input.fields.map(String).join(', ') : '';
    // 詳細・編集・追加では表示中のレコード1件だけを読む
    const { screen, recordId } = detectScreen(location.href);
    if (screen !== 'index') {
      return {
        text: t(
          'desktop.chat.approval.recordSampleCurrent',
          recordId === null ? '' : ` #${recordId}`,
          destination,
          fields
        ),
        ready: true,
      };
    }
    const limit = typeof input.limit === 'number' ? input.limit : DEFAULT_RECORD_SAMPLE_LIMIT;
    return {
      text: t('desktop.chat.approval.recordSample', String(limit), destination, fields),
      ready: true,
    };
  }
  return {
    text: t('desktop.chat.approval.generic', toolLabel(approval.toolName), destination),
    ready: true,
  };
};

/**
 * 承認カード。書き込み(登録・変更・削除)と、AIへの送信を伴う読み取りで出し分ける
 *
 * @see docs/07-ai-tools.md 5章、docs/06-ui.md 6章
 */
export function ApprovalCard(props: { approval: PendingApproval; destination: string }) {
  // AIが当てたプレビューのCSSは、承認カードの見た目(警告・ボタン)も変えられる。判断する間は外す
  useEffect(() => {
    if (cssPreview.get()?.source === 'ai') cssPreview.clear();
  }, []);
  switch (props.approval.toolName) {
    case 'write_asset':
      return <WriteApprovalCard approval={props.approval} />;
    case 'set_asset_state':
      return <StateApprovalCard approval={props.approval} />;
    case 'delete_asset':
      return <DeleteApprovalCard approval={props.approval} />;
    default:
      return <ReadApprovalCard {...props} />;
  }
}

/**
 * AIへの送信を伴う読み取り(コード本文・レコードの値)の承認
 *
 * 送る対象と送信先を示し、承認してから取得・送信する。「この会話では常に許可」はv1で持たない
 */
function ReadApprovalCard(props: { approval: PendingApproval; destination: string }) {
  const decide = useSetAtom(decideApprovalAtom);
  const description = useDescription(props.approval, props.destination);
  const [reason, setReason] = useState('');

  const approve = (event: MouseEvent) => {
    // アセットのコードが`.click()`で送信を承認できないようにする
    if (!isTrustedEvent(event) || !description.ready) return;
    void decide({ approvalId: props.approval.approvalId, approved: true });
  };

  return (
    <Alert
      severity='warning'
      icon={<span aria-hidden='true'>?</span>}
      role='group'
      aria-label={t('desktop.chat.approval.title')}
    >
      <strong>{t('desktop.chat.approval.title')}</strong>
      <div style={{ margin: '4px 0 8px', overflowWrap: 'anywhere' }}>{description.text}</div>
      <TextField
        size='small'
        fullWidth
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t('desktop.chat.approval.reason')}
        slotProps={{
          htmlInput: { 'aria-label': t('desktop.chat.approval.reason'), maxLength: 200 },
        }}
        sx={{ mb: 1 }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant='contained'
          size='small'
          color='warning'
          disabled={!description.ready}
          onClick={approve}
        >
          {t('desktop.chat.approval.approve')}
        </Button>
        <Button
          size='small'
          color='inherit'
          onClick={() =>
            void decide({ approvalId: props.approval.approvalId, approved: false, reason })
          }
        >
          {t('desktop.chat.approval.deny')}
        </Button>
      </div>
    </Alert>
  );
}

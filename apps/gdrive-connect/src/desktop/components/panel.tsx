import styled from '@emotion/styled';
import { type kintoneAPI, updateRecord } from '@konomi-app/kintone-utilities';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { type DragEvent, useEffect, useRef, useState } from 'react';
import { type DriveFile, deleteFolder, listFolderContents, uploadFile } from '@/lib/drive';
import { assignExistingFolder, createRecordFolder, readFolderId } from '@/lib/record-folder';
import type { PluginCondition } from '@/schema/plugin-config';
import { driveTokenAtom, ensureValidDriveTokenAtom, isDriveTokenValidAtom } from '../states/drive';
import AssignFolderForm from './assign-folder-form';
import ConnectButton from './connect-button';
import DriveIcon from './drive-icon';
import DropOverlay from './drop-overlay';
import FileList from './file-list';
import PreviewDrawer from './preview-drawer';
import { ErrorText, Header, PanelRoot, PrimaryButton, StatusText, Title } from './styles';
import UploadIconButton from './upload-icon-button';

const OrDivider = styled.div`
  color: var(--gdc-muted-fg, #71717a);
  font-size: 11px;
  margin: 8px 0 0;
`;

interface Props {
  condition: PluginCondition;
  oauthClientId: string;
  oauthClientSecret: string;
  record: kintoneAPI.RecordData;
  isEdit: boolean;
  appId: number | null;
  recordId: number | null;
}

/** 編集画面上でフォルダIDフィールドの値を、現在の編集内容に反映します(保存はユーザーの保存操作時) */
const stageFolderIdOnEditScreen = (fieldCode: string, folderId: string) => {
  const current = kintone.app.record.get();
  current.record[fieldCode] = {
    ...current.record[fieldCode],
    value: folderId,
  };
  kintone.app.record.set(current);
};

function Panel({
  condition,
  oauthClientId,
  oauthClientSecret,
  record,
  isEdit,
  appId,
  recordId,
}: Props) {
  const token = useAtomValue(driveTokenAtom);
  const isTokenValid = useAtomValue(isDriveTokenValidAtom);
  const ensureValidToken = useSetAtom(ensureValidDriveTokenAtom);
  const [folderId, setFolderId] = useState<string | null>(() =>
    readFolderId(record, condition.folderIdFieldCode)
  );
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingToken, setCheckingToken] = useState(true);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const listingRef = useRef(false);
  const dragCounterRef = useRef(0);

  // マウント時に一度だけ、refreshTokenによるポップアップ無しの再接続を試みる
  // biome-ignore lint/correctness/useExhaustiveDependencies: マウント時の1回のみ実行する
  useEffect(() => {
    let cancelled = false;
    void ensureValidToken({ clientId: oauthClientId, clientSecret: oauthClientSecret }).finally(
      () => {
        if (!cancelled) {
          setCheckingToken(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshFiles = async (accessToken: string, targetFolderId: string) => {
    const result = await listFolderContents({ accessToken, folderId: targetFolderId });
    setFiles(result);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: フォルダIDまたはトークンが変化した時のみ一覧を再取得する
  useEffect(() => {
    if (!isTokenValid || !token || !folderId || listingRef.current) {
      return;
    }

    const load = async () => {
      listingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        await refreshFiles(token.accessToken, folderId);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'ファイル一覧の取得に失敗しました。');
      } finally {
        setLoading(false);
        listingRef.current = false;
      }
    };

    void load();
  }, [isTokenValid, token, folderId]);

  const persistFolderId = async (newFolderId: string) => {
    if (isEdit) {
      stageFolderIdOnEditScreen(condition.folderIdFieldCode, newFolderId);
      return;
    }
    if (!appId || !recordId) {
      throw new Error('レコード情報を取得できなかったため、フォルダIDを保存できませんでした。');
    }
    await updateRecord({
      app: appId,
      id: recordId,
      record: { [condition.folderIdFieldCode]: { value: newFolderId } },
    });
  };

  const onCreateFolderClick = async () => {
    if (!token) {
      return;
    }
    setCreating(true);
    setError(null);
    let created: { id: string } | null = null;
    try {
      created = await createRecordFolder({
        accessToken: token.accessToken,
        condition,
        record,
      });
      await persistFolderId(created.id);
      setFolderId(created.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Googleドライブフォルダの作成に失敗しました。'
      );
      // フォルダ作成後にレコードへのID書き込みが失敗した場合、孤立フォルダを残さないようロールバックする
      if (created) {
        try {
          await deleteFolder({ accessToken: token.accessToken, folderId: created.id });
        } catch (rollbackCause) {
          console.error('[gdrive-connect] 孤立フォルダのロールバックに失敗しました', rollbackCause);
        }
      }
    } finally {
      setCreating(false);
    }
  };

  const onAssignFolderClick = async (input: string) => {
    if (!token) {
      return;
    }
    setAssigning(true);
    setError(null);
    try {
      const assigned = await assignExistingFolder({ accessToken: token.accessToken, input });
      await persistFolderId(assigned.id);
      setFolderId(assigned.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '既存フォルダの割り当てに失敗しました。');
    } finally {
      setAssigning(false);
    }
  };

  const onFilesSelected = async (selected: File[]) => {
    if (!token || !folderId) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      for (const file of selected) {
        await uploadFile({ accessToken: token.accessToken, folderId, file });
      }
      await refreshFiles(token.accessToken, folderId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  // フォルダとトークンが揃っている(=アップロード機能自体を提供できる)状態かどうか
  const hasReadyFolder = !!(token && folderId);
  // 実際にドラッグ&ドロップを受け付けてよいのは、上記に加えて他のアップロードが進行中でない時のみ
  const canUpload = hasReadyFolder && !uploading;

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!canUpload || !event.dataTransfer.types.includes('Files')) {
      return;
    }
    event.preventDefault();
    dragCounterRef.current += 1;
    setDragActive(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!canUpload) {
      return;
    }
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setDragActive(false);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canUpload) {
      return;
    }
    event.preventDefault();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounterRef.current = 0;
    setDragActive(false);
    if (!canUpload) {
      return;
    }
    const dropped = Array.from(event.dataTransfer.files);
    if (dropped.length > 0) {
      void onFilesSelected(dropped);
    }
  };

  const renderNoFolderState = () => {
    switch (condition.folderCreationTrigger) {
      case 'onSave':
        return <StatusText>レコード保存時に自動でフォルダが作成されます。</StatusText>;
      case 'onDemand':
        return (
          <>
            <PrimaryButton type='button' onClick={onCreateFolderClick} disabled={creating}>
              {creating ? '作成中...' : 'フォルダを作成'}
            </PrimaryButton>
            <OrDivider>または、既存のGoogleドライブフォルダを割り当てる</OrDivider>
            <AssignFolderForm disabled={assigning} onAssign={onAssignFolderClick} />
          </>
        );
      default:
        // 'manual'、または未知の値(想定外のデータ)が入っていた場合も、空白ではなく手動モードと同じ案内を表示する
        return (
          <StatusText>
            このレコードにはGoogleドライブフォルダが設定されていません。フォルダIDを直接入力するか、プラグイン設定を変更してください。
          </StatusText>
        );
    }
  };

  return (
    <PanelRoot
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Header>
        <DriveIcon size={16} />
        <Title>Googleドライブ</Title>
        {hasReadyFolder && (
          <UploadIconButton uploading={uploading} onFilesSelected={onFilesSelected} />
        )}
      </Header>
      {checkingToken ? (
        <StatusText>接続を確認しています...</StatusText>
      ) : !isTokenValid || !token ? (
        <ConnectButton oauthClientId={oauthClientId} oauthClientSecret={oauthClientSecret} />
      ) : (
        <>
          {error && <ErrorText>{error}</ErrorText>}
          {!folderId ? (
            renderNoFolderState()
          ) : loading ? (
            <StatusText>読み込んでいます...</StatusText>
          ) : (
            <FileList files={files} onPreview={setPreviewFile} />
          )}
        </>
      )}
      {dragActive && <DropOverlay />}
      <PreviewDrawer file={previewFile} onClose={() => setPreviewFile(null)} />
    </PanelRoot>
  );
}

export default Panel;

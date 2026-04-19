import { getConditionPropertyAtom } from '@/config/states/plugin';
import { currentAppFieldsAtom, kintoneAppsAtom } from '@/config/states/kintone';
import styled from '@emotion/styled';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Suspense, useCallback, useRef, useState } from 'react';
import { JotaiAppSelect, QueryBuilder } from '@konomi-app/kintone-utilities-jotai';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { GUEST_SPACE_ID, LANGUAGE } from '@/lib/global';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { JotaiFieldMultiSelect } from '@/components/field-multi-select';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';

const systemPromptAtom = getConditionPropertyAtom('systemPrompt');

const SectionLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
`;

const ToolbarGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
`;

function FieldInsertButton(props: { onInsert: (text: string) => void }) {
  const fieldProperties = useAtomValue(currentAppFieldsAtom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button variant='outlined' size='small' onClick={(e) => setAnchorEl(e.currentTarget)}>
        📋 フィールドの値を挿入
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { style: { maxHeight: 300 } } }}
      >
        {fieldProperties.map((field) => (
          <MenuItem
            key={field.code}
            onClick={() => {
              props.onInsert(`{{field:${field.code}}}`);
              setAnchorEl(null);
            }}
          >
            {field.label}
            <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>{field.code}</span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

const queryAtom = atom('');

function ExternalAppDialog(props: {
  open: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}) {
  const currentAppId = useAtomValue(currentAppIdAtom);
  const [appId, setAppId] = useState('');
  const [query, setQuery] = useAtom(queryAtom);
  const [fieldCodes, setFieldCodes] = useState<string[]>([]);

  const handleInsert = () => {
    if (!appId) {
      return;
    }
    const fields = fieldCodes.join(',');
    let snippet = `{{app:${appId}`;
    if (query) {
      snippet += `:query:${query}`;
    } else {
      snippet += ':query:';
    }
    if (fields) {
      snippet += `:fields:${fields}`;
    }
    snippet += '}}';
    props.onInsert(snippet);
    props.onClose();
    setAppId('');
    setQuery('');
    setFieldCodes([]);
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth='lg' fullWidth>
      <DialogTitle>外部アプリのレコードを参照</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='textSecondary' sx={{ mb: 2 }}>
          他のkintoneアプリのレコード情報をプロンプトに埋め込みます。
          取得したレコードはJSON形式でプロンプトに挿入されます。
        </Typography>
        <PluginFormSection>
          <PluginFormTitle>参照するアプリ</PluginFormTitle>
          <PluginFormDescription last>
            プロンプトに埋め込むレコードを取得するアプリを選択してください。
          </PluginFormDescription>
          <JotaiAppSelect
            appsAtom={kintoneAppsAtom}
            appId={appId}
            onChange={(nextAppId) => {
              setAppId(nextAppId);
              setFieldCodes([]);
            }}
          />
        </PluginFormSection>
        <PluginFormSection>
          <PluginFormTitle>クエリ条件 (任意)</PluginFormTitle>
          <PluginFormDescription last>
            取得するレコードを絞り込むためのクエリ条件を入力してください。kintoneのクエリ構文を使用できます。
          </PluginFormDescription>
          <QueryBuilder
            fieldsAtom={appFormFieldsAtom({
              app: appId || currentAppId,
              guestSpaceId: GUEST_SPACE_ID,
              preview: true,
            })}
            queryAtom={queryAtom}
            locale={LANGUAGE}
          />
        </PluginFormSection>
        <PluginFormSection>
          <PluginFormTitle>取得フィールド (任意)</PluginFormTitle>
          <PluginFormDescription last>
            プロンプトに埋め込むレコードから、特定のフィールドのみを取得したい場合は選択してください。未選択の場合は全フィールドが取得されます。
          </PluginFormDescription>
          <JotaiFieldMultiSelect
            label='取得フィールド (任意)'
            placeholder={
              appId
                ? '取得対象のフィールドを選択してください'
                : '先に参照するアプリを選択してください'
            }
            fieldPropertiesAtom={appFormFieldsAtom({
              app: appId || currentAppId,
              guestSpaceId: GUEST_SPACE_ID,
              preview: true,
            })}
            fieldCodes={fieldCodes}
            onChange={setFieldCodes}
            disabled={!appId}
            fullWidth
            sx={{ width: '100%' }}
          />
        </PluginFormSection>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>キャンセル</Button>
        <Button onClick={handleInsert} variant='contained' disabled={!appId}>
          挿入
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SystemPromptEditorComponent() {
  const [systemPrompt, setSystemPrompt] = useAtom(systemPromptAtom);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);

  const insertText = useCallback(
    (text: string) => {
      const el = textFieldRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newValue = systemPrompt.substring(0, start) + text + systemPrompt.substring(end);
        setSystemPrompt(newValue);
        requestAnimationFrame(() => {
          el.selectionStart = start + text.length;
          el.selectionEnd = start + text.length;
          el.focus();
        });
      } else {
        setSystemPrompt(systemPrompt + text);
      }
    },
    [systemPrompt, setSystemPrompt]
  );

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <SectionLabel>挿入できる値</SectionLabel>
        <ToolbarGroup>
          <Suspense fallback={null}>
            <FieldInsertButton onInsert={insertText} />
          </Suspense>
          <Button variant='outlined' size='small' onClick={() => insertText('{{record}}')}>
            📄 レコード全体
          </Button>
          <Button variant='outlined' size='small' onClick={() => setExternalDialogOpen(true)}>
            🔗 外部アプリ参照
          </Button>
          <Button variant='outlined' size='small' onClick={() => insertText('{{today}}')}>
            📅 今日の日付
          </Button>
          <Button variant='outlined' size='small' onClick={() => insertText('{{now}}')}>
            🕐 現在日時
          </Button>
          <Button variant='outlined' size='small' onClick={() => insertText('{{login_user}}')}>
            👤 ログインユーザー
          </Button>
        </ToolbarGroup>
      </div>
      <TextField
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        inputRef={textFieldRef}
        label='システムプロンプト'
        variant='outlined'
        multiline
        minRows={10}
        maxRows={24}
        fullWidth
        placeholder={[
          'あなたは業務支援AIです。以下の情報をもとに分析を行ってください。',
          '',
          '## 対象データ',
          '「📋 フィールドの値を挿入」ボタンから、レコードのフィールドを選んで挿入できます。',
          '',
          '## 出力指示',
          '下の「出力フィールド定義」で設定した各フィールドに適切な値を出力してください。',
        ].join('\n')}
      />
      <PluginErrorBoundary>
        <ExternalAppDialog
          open={externalDialogOpen}
          onClose={() => setExternalDialogOpen(false)}
          onInsert={insertText}
        />
      </PluginErrorBoundary>
    </div>
  );
}

export default function SystemPromptEditor() {
  return (
    <Suspense fallback={null}>
      <SystemPromptEditorComponent />
    </Suspense>
  );
}

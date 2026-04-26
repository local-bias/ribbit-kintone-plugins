import styled from '@emotion/styled';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import RemoveFormattingIcon from '@mui/icons-material/FormatClear';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import RedoIcon from '@mui/icons-material/Redo';
import TitleIcon from '@mui/icons-material/Title';
import UndoIcon from '@mui/icons-material/Undo';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { conditionLabelAtom } from '@/config/states/plugin';
import { normalizeTooltipHtml } from '@/lib/tooltip-html';

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
`;

const EditorShell = styled(Paper)`
  overflow: hidden;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  box-shadow: none;
`;

const EditorArea = styled.div`
  .tiptap {
    min-height: 240px;
    padding: 16px;
    outline: none;
    line-height: 1.7;
    color: #111827;
  }

  .tiptap p,
  .tiptap ul,
  .tiptap ol,
  .tiptap blockquote,
  .tiptap h2,
  .tiptap h3 {
    margin: 0;
  }

  .tiptap p + p,
  .tiptap p + ul,
  .tiptap p + ol,
  .tiptap p + blockquote,
  .tiptap ul + p,
  .tiptap ol + p,
  .tiptap blockquote + p,
  .tiptap h2 + p,
  .tiptap h3 + p {
    margin-top: 10px;
  }

  .tiptap ul,
  .tiptap ol {
    padding-left: 20px;
  }

  .tiptap blockquote {
    padding-left: 12px;
    border-left: 3px solid #93c5fd;
    color: #475569;
  }

  .tiptap h2,
  .tiptap h3 {
    font-weight: 700;
    line-height: 1.3;
  }

  .tiptap h2 {
    font-size: 1.1rem;
  }

  .tiptap h3 {
    font-size: 1rem;
  }

  .tiptap a {
    color: #2563eb;
    text-decoration: underline;
  }

  .tiptap img {
    display: block;
    max-width: min(100%, 320px);
    height: auto;
    border-radius: 10px;
  }

  .tiptap hr {
    margin: 16px 0;
    border: 0;
    border-top: 1px solid #cbd5e1;
  }

  .tiptap p.is-editor-empty:first-of-type::before {
    content: attr(data-placeholder);
    color: #94a3b8;
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

const ToolbarGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const iconButtonSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '10px',
  backgroundColor: '#fff',
};

type UrlDialogMode = 'link' | 'image';

type UrlDialogState = {
  open: boolean;
  mode: UrlDialogMode;
};

function ToolbarButton(props: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={props.title}>
      <span>
        <IconButton
          size='small'
          color={props.active ? 'primary' : 'default'}
          disabled={props.disabled}
          onClick={props.onClick}
          sx={iconButtonSx}
        >
          {props.children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function HintEditor() {
  const [value, setValue] = useAtom(conditionLabelAtom);
  const [dialogState, setDialogState] = useState<UrlDialogState>({ open: false, mode: 'link' });
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [alt, setAlt] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder:
          'ここにヒントを入力してください。見出し、箇条書き、リンク、画像もツールバーから追加できます。',
      }),
    ],
    content: normalizeTooltipHtml(value),
    onUpdate: ({ editor: currentEditor }) => {
      setValue(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const normalized = normalizeTooltipHtml(value);
    if (editor.getHTML() === normalized) {
      return;
    }
    editor.commands.setContent(normalized, { emitUpdate: false });
  }, [editor, value]);

  const openDialog = (mode: UrlDialogMode) => {
    setDialogState({ open: true, mode });
    setUrl('');
    setAlt('');
    setLabel(
      editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to) ?? ''
    );
  };

  const closeDialog = () => {
    setDialogState((current) => ({ ...current, open: false }));
    setUrl('');
    setAlt('');
    setLabel('');
  };

  const submitDialog = () => {
    if (!editor || !url.trim()) {
      return;
    }
    if (dialogState.mode === 'image') {
      const escapedAlt = alt.replace(/"/g, '&quot;');
      editor.chain().focus().insertContent(`<img src="${url.trim()}" alt="${escapedAlt}" />`).run();
      closeDialog();
      return;
    }

    if (editor.state.selection.empty) {
      const linkText = label.trim() || url.trim();
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
        )
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
    closeDialog();
  };

  return (
    <div>
      <EditorShell>
        <Toolbar>
          <ToolbarGroup>
            <ToolbarButton
              title='太字'
              active={editor?.isActive('bold')}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <FormatBoldIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='斜体'
              active={editor?.isActive('italic')}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <FormatItalicIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='下線'
              active={editor?.isActive('underline')}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <FormatUnderlinedIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='書式をクリア'
              disabled={!editor}
              onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            >
              <RemoveFormattingIcon fontSize='small' />
            </ToolbarButton>
          </ToolbarGroup>
          <Divider orientation='vertical' flexItem />
          <ToolbarGroup>
            <ToolbarButton
              title='見出し'
              active={Boolean(editor?.isActive('heading', { level: 2 }))}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <TitleIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='箇条書き'
              active={editor?.isActive('bulletList')}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <FormatListBulletedIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='番号付きリスト'
              active={editor?.isActive('orderedList')}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <FormatListNumberedIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='引用'
              active={editor?.isActive('blockquote')}
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <FormatQuoteIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='区切り線'
              disabled={!editor}
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            >
              <HorizontalRuleIcon fontSize='small' />
            </ToolbarButton>
          </ToolbarGroup>
          <Divider orientation='vertical' flexItem />
          <ToolbarGroup>
            <ToolbarButton
              title='リンクを追加'
              disabled={!editor}
              onClick={() => openDialog('link')}
            >
              <LinkIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='リンクを削除'
              disabled={!editor || !editor.isActive('link')}
              onClick={() => editor?.chain().focus().unsetLink().run()}
            >
              <HighlightOffIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='画像を追加'
              disabled={!editor}
              onClick={() => openDialog('image')}
            >
              <ImageIcon fontSize='small' />
            </ToolbarButton>
          </ToolbarGroup>
          <Divider orientation='vertical' flexItem />
          <ToolbarGroup>
            <ToolbarButton
              title='元に戻す'
              disabled={!editor?.can().undo()}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              <UndoIcon fontSize='small' />
            </ToolbarButton>
            <ToolbarButton
              title='やり直す'
              disabled={!editor?.can().redo()}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              <RedoIcon fontSize='small' />
            </ToolbarButton>
          </ToolbarGroup>
        </Toolbar>
        <EditorArea>
          <EditorContent editor={editor} />
        </EditorArea>
      </EditorShell>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
        ツールバーから文字装飾や見出し、リンク、画像を追加できます。
      </Typography>
      <Dialog open={dialogState.open} onClose={closeDialog} maxWidth='xs' fullWidth>
        <DialogTitle>{dialogState.mode === 'image' ? '画像を挿入' : 'リンクを挿入'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin='dense'
            label={dialogState.mode === 'image' ? '画像URL' : 'リンクURL'}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder='https://example.com/...'
          />
          {dialogState.mode === 'image' ? (
            <TextField
              fullWidth
              margin='dense'
              label='代替テキスト'
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
            />
          ) : (
            <TextField
              fullWidth
              margin='dense'
              label='表示テキスト'
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              helperText='文字を選択してからリンクを追加した場合は、その選択範囲がリンクになります。'
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>キャンセル</Button>
          <Button onClick={submitDialog} disabled={!url.trim()} variant='contained'>
            挿入
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

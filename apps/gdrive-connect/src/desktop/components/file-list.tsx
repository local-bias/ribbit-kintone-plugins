import styled from '@emotion/styled';
import {
  ExternalLink,
  File,
  FileArchive,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Image,
  Presentation,
} from 'lucide-react';
import type { DriveFile } from '@/lib/drive';
import { getIconCategory } from '@/lib/mime-icon';
import { StatusText } from './styles';

const ICON_BY_CATEGORY = {
  folder: Folder,
  image: Image,
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  document: FileText,
  presentation: Presentation,
  archive: FileArchive,
  video: FileVideo,
  audio: FileAudio,
  other: File,
} as const;

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
`;

const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  border-bottom: 1px solid var(--gdc-border, #e4e4e7);
  border-radius: var(--gdc-radius, 3px);
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--gdc-muted, #f7f7f8);
  }
`;

const NameButton = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  border: none;
  background: none;
  padding: 0;
  text-align: left;
  color: var(--gdc-fg, #18181b);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
`;

const OpenLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--gdc-radius, 3px);
  color: var(--gdc-muted-fg, #71717a);
  flex-shrink: 0;

  &:hover {
    background: var(--gdc-muted-2, #f1f1f3);
  }
`;

const Meta = styled.span`
  color: var(--gdc-muted-fg, #71717a);
  font-size: 11px;
  flex-shrink: 0;
  width: 88px;
  text-align: right;
`;

const IconWrapper = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  margin-right: 8px;
  color: var(--gdc-muted-fg, #71717a);
`;

const formatSize = (size?: string): string => {
  if (!size) {
    return '';
  }
  const bytes = Number(size);
  if (!Number.isFinite(bytes)) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const formatModifiedTime = (value?: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

interface Props {
  files: DriveFile[];
  onPreview: (file: DriveFile) => void;
}

function FileList({ files, onPreview }: Props) {
  if (files.length === 0) {
    return <StatusText>フォルダにファイルがありません。</StatusText>;
  }

  return (
    <List>
      {files.map((file) => {
        const isFolder = file.mimeType === FOLDER_MIME_TYPE;
        const Icon = ICON_BY_CATEGORY[getIconCategory(file.mimeType)];
        return (
          <Item key={file.id}>
            <NameButton
              type='button'
              onClick={() => {
                if (isFolder) {
                  if (file.webViewLink) {
                    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
                  }
                  return;
                }
                onPreview(file);
              }}
            >
              <IconWrapper>
                <Icon size={16} strokeWidth={1.5} />
              </IconWrapper>
              {file.name}
            </NameButton>
            <Meta>{formatModifiedTime(file.modifiedTime) || formatSize(file.size)}</Meta>
            {file.webViewLink && (
              <OpenLink
                href={file.webViewLink}
                target='_blank'
                rel='noopener noreferrer'
                title='Googleドライブで開く'
              >
                <ExternalLink size={14} strokeWidth={1.75} />
              </OpenLink>
            )}
          </Item>
        );
      })}
    </List>
  );
}

export default FileList;

import styled from '@emotion/styled';

/**
 * ツールバー関連の共通スタイルコンポーネント。
 * gantt のスタイルを正として定義し、各プラグインから再利用する。
 */

export const ToolbarContainer = styled.div`
  position: sticky;
  top: 48px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
  flex-wrap: wrap;
`;

export const ToolbarButtonGroup = styled.div`
  display: flex;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`;

export const ToolbarGroupButton = styled.button<{ active?: boolean }>`
  padding: 4px 12px;
  border: none;
  border-right: 1px solid #ccc;
  background-color: ${({ active }) => (active ? '#4285F4' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;

  &:last-child {
    border-right: none;
  }

  &:hover {
    background-color: ${({ active }) => (active ? '#3367d6' : '#f0f0f0')};
  }
`;

export const ToolbarActionButton = styled.button`
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;

  &:hover {
    background-color: #f0f0f0;
  }
`;

export const ToolbarAddButton = styled.button`
  padding: 4px 12px;
  border: 1px solid #4285f4;
  border-radius: 4px;
  background-color: #4285f4;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;

  &:hover {
    background-color: #3367d6;
  }
`;

export const ToolbarNavButton = styled.button`
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;
  min-width: 28px;

  &:hover {
    background-color: #f0f0f0;
  }
`;

export const ToolbarSeparator = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e0e0e0;
  margin: 0 4px;
`;

export const ToolbarSpacer = styled.div`
  flex: 1;
`;

export const ToolbarSearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const ToolbarSearchIcon = styled.span`
  position: absolute;
  left: 8px;
  font-size: 13px;
  color: #888;
  pointer-events: none;
`;

export const ToolbarSearchInput = styled.input`
  padding: 4px 28px 4px 28px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  width: 160px;
  outline: none;
  transition:
    border-color 0.15s,
    width 0.2s;
  background-color: #fff;

  &:focus {
    border-color: #4285f4;
    width: 200px;
  }

  &:disabled {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #aaa;
  }
`;

export const ToolbarSearchClear = styled.button`
  position: absolute;
  right: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  padding: 2px;
  line-height: 1;
  display: flex;
  align-items: center;

  &:hover {
    color: #333;
  }
`;

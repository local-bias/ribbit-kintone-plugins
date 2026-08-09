import styled from '@emotion/styled';

// 目次コンテナ
export const TOCContainer = styled.ul`
  box-sizing: border-box;
  margin: 0;
  padding: 16px;
  padding-top: 8px;
  list-style: none;
`;

// 各目次アイテム
export const TOCItem = styled.li<{ $active?: boolean; $color?: string; }>`
  box-sizing: border-box;
  list-style: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.5;
  color: var(--🐸foreground, #333);
  transition: all 0.2s ease;
  position: relative;
  border-left: 3px solid transparent;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  ${({ $active, $color }) =>
    $active &&
    `
    background-color: color-mix(in oklab, ${$color} 10%, transparent);
    border-left-color: ${$color};
    font-weight: 500;

    &:hover {
      background-color: color-mix(in oklab, ${$color} 20%, transparent);
    }
  `}
`;

// タイトルコンテナ
export const TOCTitleContainer = styled.h2`
  box-sizing: border-box;
  margin: 0;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  color: color-mix(in oklab, var(--🐸foreground) 70%, transparent);
  gap: 10px;
  border-bottom: 1px solid var(--🐸border);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.4;

  svg {
    width: 16px;
    height: 16px;
    opacity: 0.7;
  }
`;

// タブボタン（サイドバー右用）
export const TabButton = styled.button<{ $selected?: boolean; }>`
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background-color: ${({ $selected }) => ($selected ? '#3498db' : '#a0a0a0')};
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 0;

  &:hover {
    filter: brightness(95%);
  }

  &:focus {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  svg {
    width: 24px;
    height: 24px;
    color: #ffffff;
  }
`;

// サイドバーコンテンツラッパー
export const SidebarContentWrapper = styled.div`
  box-sizing: border-box;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

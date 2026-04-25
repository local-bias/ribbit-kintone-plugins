import styled from '@emotion/styled';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';

/**
 * Radix UI ベースのコンテキストメニュー共通スタイルコンポーネント。
 *
 * gantt のスタイルを正として定義し、各プラグインから再利用する。
 */

export const ContextMenuRoot = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuPortal = ContextMenuPrimitive.Portal;
export const ContextMenuSub = ContextMenuPrimitive.Sub;

export const ContextMenuContent = styled(ContextMenuPrimitive.Content)`
  min-width: 180px;
  background-color: #fff;
  border-radius: 6px;
  padding: 4px;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  z-index: 100;
  animation: contextMenuFadeIn 0.1s ease-out;

  @keyframes contextMenuFadeIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

export const ContextMenuItem = styled(ContextMenuPrimitive.Item)`
  font-size: 13px;
  line-height: 1;
  color: #333;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  position: relative;
  user-select: none;
  outline: none;
  border-radius: 4px;
  cursor: pointer;
  gap: 8px;

  &[data-highlighted] {
    background-color: #4285f4;
    color: #fff;
  }

  &[data-disabled] {
    color: #aaa;
    pointer-events: none;
  }
`;

export const ContextMenuSeparator = styled(ContextMenuPrimitive.Separator)`
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
`;

export const ContextMenuDestructiveItem = styled(ContextMenuItem)`
  color: #ea4335;

  &[data-highlighted] {
    background-color: #ea4335;
    color: #fff;
  }
`;

export const ContextMenuSubTrigger = styled(ContextMenuPrimitive.SubTrigger)`
  font-size: 13px;
  line-height: 1;
  color: #333;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  position: relative;
  user-select: none;
  outline: none;
  border-radius: 4px;
  cursor: pointer;
  gap: 8px;

  &[data-highlighted] {
    background-color: #4285f4;
    color: #fff;
  }

  &[data-disabled] {
    color: #aaa;
    pointer-events: none;
  }
`;

export const ContextMenuSubContent = styled(ContextMenuPrimitive.SubContent)`
  min-width: 140px;
  background-color: #fff;
  border-radius: 6px;
  padding: 4px;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  z-index: 101;
  animation: contextMenuFadeIn 0.1s ease-out;

  @keyframes contextMenuFadeIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

export const ContextMenuSubTriggerArrow = styled.span`
  margin-left: auto;
  font-size: 11px;
`;

export const ContextMenuIconWrapper = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

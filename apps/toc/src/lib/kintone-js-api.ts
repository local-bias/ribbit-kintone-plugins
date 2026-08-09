export type SidebarState = 'OPEN' | 'CLOSED' | 'HISTORY' | 'COMMENTS';

export function getSidebarDisplayState(): Promise<SidebarState> {
  // @ts-ignore - kintone.d.tsに定義がないため暫定対応
  return kintone.app.record.getSideBarDisplayState();
}

export function updateSidebarState(state: SidebarState): Promise<void> {
  // @ts-ignore - kintone.d.tsに定義がないため暫定対応
  return kintone.app.record.showSideBar(state);
}

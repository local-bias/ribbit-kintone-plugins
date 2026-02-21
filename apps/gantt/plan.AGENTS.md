# Plan: ガントチャート kintone プラグイン実装

**概要:** `apps/gantt` に kintone カスタムビューへ埋め込むガントチャートプラグインを実装する。外部ガントライブラリは使わず、Emotion + React + dnd-kit で描画。設定画面でビュー選択・フィールドマッピングを行い、デスクトップ側でレコードを取得してガントを描画する。カテゴリ/担当者グループ化と 日/週/月 スケール切替を UI で提供する。

---

## 実装ステータス

### ✅ 完了済み

#### Step 1 — スキーマ定義 (`src/schema/plugin-config.ts`)

- `id`, `memo`, `viewId`, `titleFieldCode`, `startDateFieldCode`, `endDateFieldCode`, `assigneeFieldCode`, `categoryFieldCode`, `progressFieldCode`, `colorFieldCode`, `defaultScale` を定義
- `AnyPluginConfigSchema`, `PluginConfig`, `PluginCondition`, `GanttScale` 型エクスポート

#### Step 2 — lib 更新

- `src/lib/plugin.ts`: `getNewCondition()` / `createConfig()` / `isPluginConditionMet` / `isUsagePluginConditionMet` / `VIEW_ROOT_ID` を実装
- `src/lib/i18n.ts`: 日本語・英語・スペイン語・中国語のi18nキーを定義

#### Step 3 — 設定画面フォーム

- ビュー選択、フィールドマッピング、デフォルトスケール選択を実装済み
- `@emotion/styled` でスタイリング

#### Step 4 — デスクトップ側 状態管理 (`src/desktop/public-state.ts`)

- `pluginConfigAtom`, `currentConditionAtom`, `ganttRecordsAtom`, `ganttScaleAtom`, `ganttGroupByAtom`, `ganttViewDateAtom`, `ganttLoadingAtom`, `ganttAppIdAtom`, `addTaskDialogOpenAtom`, `collapsedGroupsAtom` を定義

#### Step 5 — デスクトップ イベントハンドラ (`src/desktop/event.tsx`)

- `app.record.index.show` でビューID照合、レコード取得、`createRoot` でレンダリング
- `cachedRoot` でページ遷移間の再利用

#### Step 6 — デスクトップ コンポーネント群

**`app.tsx`** — `Provider` + `PluginErrorBoundary` + `ThemeProvider` + `SnackbarProvider` + `GanttContainer`

**`components/gantt-container.tsx`** — ツールバー + チャート本体 + ローディング/空メッセージ + AddTaskDialog

**`components/gantt-toolbar.tsx`**:

- 今日ボタン、前後ナビゲーション、スケール切替（日/週/月）、グループ化切替（カテゴリ/担当者）、新規タスクボタン

**`components/gantt-chart.tsx`** — DndContext + サイドバー + タイムライン:

- 左サイドバー（固定幅200px）+ 右スクロール領域
- `useRef` でスクロール同期
- **クロスグループD&D対応**: `pointerWithin` collision detection、`DragOver` でグループ変更検知、水平+垂直ドラッグで日付変更+カテゴリ/担当者変更を同時実行
- **バーリサイズ対応**: `RESIZE_START`/`RESIZE_END` ドラッグタイプで開始日/終了日を個別調整、`activeDragType` 状態で操作種別を追跡
- `DragOverlay` でドラッグ中のバー表示（バー移動時のみ、リサイズ時は非表示）

**`components/gantt-header.tsx`** — 2行ヘッダー（月ラベル + 日付/週/月ラベル）

**`components/gantt-body.tsx`** — DroppableGroupSection + グリッド線 + 週末背景 + 今日マーカー + グループ折りたたみ対応

**`components/gantt-sidebar.tsx`** — DroppableGroup + SortableContext + グループ折りたたみUI（▼アイコン + クリックトグル）+ コンテキストメニュー付きタスク項目

**`components/gantt-bar.tsx`** — タスクバー:

- 進捗率バー、カラーパレット（12色）、ツールチップ（MUI Tooltip）
- ダブルクリックでレコード表示
- `TaskContextMenu` でラップ（右クリックメニュー）
- **バーエッジリサイズ**: 左端/右端にリサイズハンドル（`ResizeStartHandle` / `ResizeEndHandle`）を配置。ホバー時にハンドル表示、ドラッグで開始日/終了日を個別調整可能

**`components/task-context-menu.tsx`** — Radix UI ContextMenu:

- レコードを表示（新しいタブ）
- レコードを編集（編集モードで新しいタブ）
- レコードを複製（全フィールドをコピーして新規レコード作成）
- レコードを削除（確認ダイアログ付き）

**`components/add-task-dialog.tsx`** — MUI Dialog で新規タスク追加（タイトル、開始日、終了日）

#### Step 7 — ガントチャート描画ロジック (`hooks/use-gantt-layout.ts`)

- レコード→タスク変換（`GanttTask` に `assigneeCodes` 追加）
- レンジ計算（全タスクの最小開始日〜最大終了日 + パディング）
- スケール別列生成（day/week/month）
- `dateToX()` 日付→ピクセル変換
- グループ化（`GanttGroup` に `code` フィールド追加 — API更新用）
- カラーマッピング

#### Step 8 — レコード操作 (`src/desktop/record-operations.ts`)

- `updateTaskDates`: 日付更新（開始日+終了日同時変更）
- `updateTaskStartDate`: 開始日のみ更新（リサイズ用）
- `updateTaskEndDate`: 終了日のみ更新（リサイズ用）
- `updateTaskCategory`: カテゴリ更新
- `updateTaskAssignee`: 担当者更新
- `deleteTask`: レコード削除
- `duplicateTask`: レコード複製（システムフィールド除外、全ユーザーフィールドコピー）
- `createNewTask`: 新規タスク作成
- `refreshRecords`: レコード一覧リフレッシュ

---

## 描画仕様

| 項目                 | 仕様                                                          |
| -------------------- | ------------------------------------------------------------- |
| 左サイドバー幅       | 200px 固定                                                    |
| 行高さ               | グループヘッダー行: 36px, タスク行: 32px                      |
| カラーパレット       | `colorFieldCode` の値文字列に対して固定マッピング（最大12色） |
| ツールチップ         | MUI `Tooltip` コンポーネント                                  |
| 縦スクロール同期     | 左サイドバーと右エリアを `onScroll` でミラーリング            |
| 横スクロール         | 右エリアのみ、`overflow-x: auto`                              |
| スケール切替時       | 今日が画面中央に来るよう `scrollLeft` を自動調整              |
| D&D                  | 水平ドラッグ=日付変更、グループ間ドラッグ=カテゴリ/担当者変更 |
| バーリサイズ         | 左端ドラッグ=開始日調整、右端ドラッグ=終了日調整              |
| コンテキストメニュー | Radix UI ContextMenu（表示/編集/複製/削除）                   |
| グループ折りたたみ   | クリックでトグル、サイドバー・タイムライン同期                |

---

## Verification

1. ビルド確認: `pnpm build` in `apps/gantt/` ✅
2. 型チェック: `npx tsc --noEmit` ✅
3. kintone 環境で:
   - 設定画面: ビュー・フィールドが正常に選択できること
   - デスクトップ: カスタムビューにガントが描画されること
   - スケール切替・グループ化切替が機能すること
   - 今日マーカーが正しい位置に表示されること
   - クロスグループD&D（カテゴリ/担当者変更）が機能すること
   - コンテキストメニュー（表示/編集/複製/削除）が機能すること
   - バーエッジリサイズ（開始日/終了日調整）が機能すること
   - グループ折りたたみが機能すること

---

## Decisions

- ガントライブラリなし → 純粋な CSS/Emotion + React 実装（配置はピクセル計算、`position: absolute`）
- ドラッグアンドドロップは `dnd-kit` を使用（水平=日付、垂直=グループ間移動）
- コンテキストメニューは `@radix-ui/react-context-menu` を使用
- カスタムビュー埋め込み → smart-view パターン（`createRoot`）
- グループ化切替 → UI 上でリアルタイム切替
- 設定は複数条件対応（各 viewId ごとに条件を作成）
- TailwindCSS は使用しない、`@emotion/styled` で統一

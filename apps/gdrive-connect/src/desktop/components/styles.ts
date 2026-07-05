import styled from '@emotion/styled';

/**
 * デザイントークン
 *
 * kintone標準UIの見た目(角ばった/ほぼ直角なフォルム、ニュートラルな配色、高い情報密度)から
 * 大きく乖離しないよう、reference-tableプラグインで採用したzinc系ニュートラルパレットを踏襲する。
 * アクセントカラーのみGoogleドライブを想起させる青(#1a73e8, Google製品群で広く使われる色)にし、
 * 「Googleドライブの領域である」ことがひと目でわかるようにする。
 */
export const PanelRoot = styled.div`
  --gdc-bg: #ffffff;
  --gdc-fg: #18181b;
  --gdc-muted: #f7f7f8;
  --gdc-muted-2: #f1f1f3;
  --gdc-muted-fg: #71717a;
  --gdc-border: #e4e4e7;
  --gdc-border-strong: #d4d4d8;
  --gdc-radius: 3px;
  --gdc-accent: #1a73e8;
  --gdc-accent-hover: #1558b0;
  --gdc-accent-soft: #e8f0fe;
  --gdc-danger: #d93025;
  --gdc-drive-blue: #2684fc;
  --gdc-drive-green: #00ac47;
  --gdc-drive-yellow: #ffba00;

  position: relative;
  font-size: 13px;
  line-height: 1.5;
  color: var(--gdc-fg);
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--gdc-border);
`;

export const HeaderIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-left: auto;
  border-radius: var(--gdc-radius);
  border: none;
  background: transparent;
  color: var(--gdc-muted-fg);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--gdc-muted-2);
    color: var(--gdc-accent);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const Title = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: var(--gdc-fg);
`;

const buttonBase = `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--gdc-radius);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const PrimaryButton = styled.button`
  ${buttonBase}
  border: 1px solid var(--gdc-accent);
  background: var(--gdc-accent);
  color: #fff;

  &:hover:not(:disabled) {
    background: var(--gdc-accent-hover);
    border-color: var(--gdc-accent-hover);
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  border: 1px solid var(--gdc-border-strong);
  background: var(--gdc-bg);
  color: var(--gdc-fg);

  &:hover:not(:disabled) {
    background: var(--gdc-muted);
  }
`;

export const ErrorText = styled.div`
  color: var(--gdc-danger);
  font-size: 12px;
  margin-bottom: 8px;
`;

export const StatusText = styled.div`
  color: var(--gdc-muted-fg);
  font-size: 12px;
  padding: 8px 0;
`;

import styled from '@emotion/styled';
import { UploadCloud } from 'lucide-react';

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--gdc-accent-soft, #e8f0fe);
  border: 2px dashed var(--gdc-accent, #1a73e8);
  border-radius: var(--gdc-radius, 3px);
  color: var(--gdc-accent, #1a73e8);
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
`;

/** ファイルをドラッグ中のみ、プラグイン領域全体を覆って表示するドロップ先の目印です */
function DropOverlay() {
  return (
    <Overlay>
      <UploadCloud size={26} strokeWidth={1.5} />
      <span>ここにドロップ</span>
    </Overlay>
  );
}

export default DropOverlay;

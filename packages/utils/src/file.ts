import { saveAs } from 'file-saver';

export function saveAsJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null)], {
    type: 'application/json',
  });
  saveAs(blob, filename);
}

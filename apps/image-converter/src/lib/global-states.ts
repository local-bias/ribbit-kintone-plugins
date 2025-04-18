import { atom } from 'jotai';
import { derive } from 'jotai-derive';
import { atomFamily } from 'jotai/utils';
import { enqueueSnackbar } from 'notistack';
import { convertImageFormat, isFormatSupported } from './image';
import { ImageFormat } from '@/schema/image';

const isFormatSupportedAtom = atomFamily((format: 'webp' | 'avif' | 'jpeg' | 'png') => {
  return atom(() => {
    return isFormatSupported(format);
  });
});

export const formatSupportListAtom = atom((get) => {
  return [
    { format: 'webp', supported: get(isFormatSupportedAtom('webp')) },
    { format: 'avif', supported: get(isFormatSupportedAtom('avif')) },
    { format: 'jpeg', supported: get(isFormatSupportedAtom('jpeg')) },
    { format: 'png', supported: get(isFormatSupportedAtom('png')) },
  ];
});

export const filesAtom = atom<File[]>([]);

export const handleFileDropAtom = atom(null, async (_, set, files: File[]) => {
  set(filesAtom, files);
});

export const convertedImageFilesAtom = atomFamily((format: ImageFormat) => {
  return atom(async (get) => {
    const isSupported = get(isFormatSupportedAtom(format));
    if (!isSupported) {
      return [];
    }
    const files = get(filesAtom);
    const convertedFiles: Blob[] = [];
    if (files.length > 0) {
      for (const file of files) {
        try {
          const convertedBlob = await convertImageFormat(file, format, 0.8);
          convertedFiles.push(convertedBlob);
        } catch (error) {
          enqueueSnackbar(`Error converting ${file.name}: ${error}`, { variant: 'error' });
        }
      }
    }
    return convertedFiles;
  });
});

export const convertedImageUrlsAtom = atomFamily((format: ImageFormat) =>
  derive([convertedImageFilesAtom(format)], (convertedFiles) => {
    return convertedFiles.map((file) => URL.createObjectURL(file));
  })
);

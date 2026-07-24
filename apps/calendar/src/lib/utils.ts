import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSortedOptions = (
  options:
    | kintoneAPI.property.MultiSelect['options']
    | kintoneAPI.property.RadioButton['options']
    | kintoneAPI.property.CheckBox['options']
    | kintoneAPI.property.Dropdown['options']
) => {
  return Object.values(options).sort((a, b) => {
    const aIndex = Number(a.index);
    const bIndex = Number(b.index);

    if (isNaN(aIndex) || isNaN(bIndex)) {
      return 0;
    }
    return aIndex - bIndex;
  });
};

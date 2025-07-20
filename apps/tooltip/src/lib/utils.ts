import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function withPrefix(className: string) {
  return className
    .split(' ')
    .map((c) => `rad:${c}`)
    .join(' ');
}

//@ts-check
import common from './tailwind.config.common.mjs';
import { mergeDeep } from 'remeda';

/** @type { import('tailwindcss').Config } */
const config = {
  content: [
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/config/**/*.{ts,tsx}',
  ],
};

export default mergeDeep(config, common);

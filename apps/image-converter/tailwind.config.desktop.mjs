//@ts-check
import common from './tailwind.config.common.mjs';
import { mergeDeep } from 'remeda';

/** @type { import('tailwindcss').Config } */
const config = {
  important: '.🐸',
  corePlugins: {
    preflight: false,
  },
  content: [
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/desktop/**/*.{ts,tsx}',
  ],
};

export default mergeDeep(config, common);

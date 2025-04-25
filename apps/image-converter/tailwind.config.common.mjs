//@ts-check
import defaultTheme from 'tailwindcss/defaultTheme.js';
import animatePlugin from 'tailwindcss-animate';
import { mergeDeep } from 'remeda';
import defaultConfig from '@repo/tailwind-config';

/** @type { Omit<import('tailwindcss').Config, 'content'> } */
const config = {
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--ribbit-border))',
        input: 'hsl(var(--ribbit-input))',
        ring: 'hsl(var(--ribbit-ring))',
        background: 'hsl(var(--ribbit-background))',
        foreground: 'hsl(var(--ribbit-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--ribbit-primary))',
          foreground: 'hsl(var(--ribbit-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--ribbit-secondary))',
          foreground: 'hsl(var(--ribbit-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--ribbit-destructive))',
          foreground: 'hsl(var(--ribbit-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--ribbit-muted))',
          foreground: 'hsl(var(--ribbit-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--ribbit-accent))',
          foreground: 'hsl(var(--ribbit-accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--ribbit-popover))',
          foreground: 'hsl(var(--ribbit-popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--ribbit-card))',
          foreground: 'hsl(var(--ribbit-card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--ribbit-radius)`,
        md: `calc(var(--ribbit-radius) - 2px)`,
        sm: 'calc(var(--ribbit-radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--ribbit-font-sans)', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--ribbit-radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--ribbit-radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animatePlugin],
};

export default mergeDeep(defaultConfig, config);

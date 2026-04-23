import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
        body: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        // Vibrant Palette
        'vibrant-blue': '#0071e3',
        'vibrant-purple': '#af52de',
        'vibrant-cyan': '#32ade6',
        'vibrant-green': '#34c759',
        'vibrant-red': '#ff3b30',
        'vibrant-orange': '#ff9500',

        // Semantic (CSS var-backed)
        background: 'var(--bg-main)',
        surface:    'var(--surface-1)',
        card:       'var(--surface-2)',
        primary:    'var(--text-primary)',
        secondary:  'var(--text-secondary)',
        tertiary:   'var(--text-tertiary)',
        accent:     '#0071e3',
        'card-border': 'var(--border-color)',
      },
      borderRadius: {
        'apple-sm':   '6px',
        'apple':      '12px',
        'apple-md':   '16px',
        'apple-lg':   '24px',
        'apple-pill': '980px',
        'apple-full': '50%',
      },
      boxShadow: {
        'apple-card':    'var(--shadow-card)',
        'apple-product': 'var(--shadow-product)',
        'apple-nav':     'rgba(0,0,0,0.15) 0px 1px 0px 0px',
        'neon-blue':     '0 0 15px rgba(0, 113, 227, 0.4)',
        'neon-purple':   '0 0 15px rgba(175, 82, 222, 0.4)',
      },
      letterSpacing: {
        'apple-hero':  '-0.02em',
        'apple-body':  '-0.01em',
        'apple-sm':    '0em',
        'apple-micro': '0.05em',
      },
      lineHeight: {
        'apple-hero':   '1.1',
        'apple-section':'1.2',
        'apple-tile':   '1.3',
        'apple-card':   '1.4',
        'apple-body':   '1.5',
        'apple-caption':'1.4',
        'apple-micro':  '1.3',
        'apple-button': '1',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'bounce-slight': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        'apple': '20px',
        'glass': '40px',
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'fade-in':    'fade-in 0.5s ease-out forwards',
        'slide-up':   'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'fade-in': {
          from: { opacity: '0', filter: 'blur(4px)' },
          to:   { opacity: '1', filter: 'blur(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

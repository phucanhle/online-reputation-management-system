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
        // SF Pro Display — for 20px+ headings
        display: [
          '-apple-system',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        // SF Pro Text — for body / below 20px
        body: [
          '-apple-system',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        sans: [
          '-apple-system',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Apple Design Tokens
        'apple-blue':      '#0071e3',
        'apple-blue-dark': '#2997ff',
        'apple-link':      '#0066cc',
        'apple-black':     '#000000',
        'apple-near-black':'#1d1d1f',
        'apple-light':     '#f5f5f7',
        'apple-white':     '#ffffff',

        // Dark surface scale
        'dark-s1': '#1c1c1e',
        'dark-s2': '#28282a',
        'dark-s3': '#3a3a3c',

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
        // Apple radius scale
        'apple-sm':   '5px',
        'apple':      '8px',
        'apple-md':  '11px',
        'apple-lg':  '12px',
        'apple-pill':'980px',
        'apple-full':'50%',
      },
      boxShadow: {
        'apple-card':    'var(--shadow-card)',
        'apple-product': 'rgba(0,0,0,0.22) 3px 5px 30px 0px',
        'apple-nav':     'rgba(0,0,0,0.15) 0px 1px 0px 0px',
      },
      letterSpacing: {
        'apple-hero':  '-0.28px',
        'apple-body':  '-0.374px',
        'apple-sm':    '-0.224px',
        'apple-micro': '-0.12px',
      },
      lineHeight: {
        'apple-hero':   '1.07',
        'apple-section':'1.10',
        'apple-tile':   '1.14',
        'apple-card':   '1.19',
        'apple-body':   '1.47',
        'apple-caption':'1.29',
        'apple-micro':  '1.33',
        'apple-button': '2.41',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      backdropBlur: {
        'apple': '20px',
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'fade-in':    'fade-in 0.4s ease-out forwards',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

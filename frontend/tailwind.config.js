/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Netflix-inspired palette
        nf: {
          red:     '#e50914',
          darkred: '#c0000c',
          gold:    '#f5c518',
          blue:    '#018bff',
          cyan:    '#00d4ff',
        },
        // Surface layers
        void:    '#050507',
        base:    '#0a0a0f',
        surface: '#111118',
        card:    '#16161f',
        hover:   '#1e1e2a',
        // Legacy aliases for unchanged pages
        cine: {
          dark:    '#08090d',
          card:    '#10131a',
          hover:   '#181d28',
          border:  '#232a3b',
          gold:    '#e5a93c',
          crimson: '#e11d48',
          emerald: '#10b981',
          cyan:    '#06b6d4',
          purple:  '#8b5cf6',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow':    'spin 8s linear infinite',
        'float':        'float 4s ease-in-out infinite',
        'pulse-soft':   'pulse 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.8s infinite',
        'fade-in':      'fadeIn 0.5s ease forwards',
        'fade-up':      'fadeUp 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400% 0' },
          '100%': { backgroundPosition:  '400% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cine: {
          dark: '#08090d',
          card: '#10131a',
          hover: '#181d28',
          border: '#232a3b',
          gold: '#e5a93c',
          crimson: '#e11d48',
          emerald: '#10b981',
          cyan: '#06b6d4',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

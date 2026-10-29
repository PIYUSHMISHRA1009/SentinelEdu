/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        ivory: {
          50: '#fdfbf7',
          100: '#f8f6f0',
          200: '#f1ede4',
          300: '#e5dec9',
        },
        oxford: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        crimson: {
          50: '#fff1f2',
          100: '#ffe4e6',
          700: '#be123c',
          800: '#9f1239',
          900: '#800020',
          950: '#4c0519',
        },
      },
    },
  },
  plugins: [],
}
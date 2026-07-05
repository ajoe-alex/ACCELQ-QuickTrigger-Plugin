/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bccffe',
          300: '#8eaefd',
          400: '#5a83fa',
          500: '#3660f4',
          600: '#2340e8',
          700: '#1e30cf',
          800: '#1f2ba7',
          900: '#1e2984',
        },
      },
    },
  },
  plugins: [],
}

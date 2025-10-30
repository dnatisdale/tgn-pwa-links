// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        thaiRed: '#A51931',
        thaiWhite: '#F4F5F8',
        thaiBlue: '#2D2A4A',
        thaiBlack: '#000000',
      },
    },
  },
  plugins: [],
  theme: {
    extend: {
      fontFamily: {
        en: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        th: ['"Noto Sans Thai"', 'ui-sans-serif', 'system-ui', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
};

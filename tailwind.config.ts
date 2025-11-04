// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
export default {
  // ✅ These paths look correct for Vite + React
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],

  // ✅ Add this if you plan to support dark theme toggling later
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        thaiRed: '#A51931',
        thaiWhite: '#F4F5F8',
        thaiBlue: '#2D2A4A',
        thaiBlack: '#000000',
      },
      fontFamily: {
        // ✅ This matches what we used in styles: font-krub
        krub: ['"Krub"', 'system-ui', '"Segoe UI"', '"Noto Sans Thai"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        thaiRed: '#A51931',
        thaiWhite: '#F4F5F8',
        thaiBlue: '#2D2A4A',
        thaiBlack: '#000000',
      },
      fontFamily: {
        krub: ['Krub', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

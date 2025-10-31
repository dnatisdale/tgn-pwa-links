/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        // gives you the `font-krub` class
        krub: ['"Krub"', 'system-ui', 'sans-serif'],
      },
      colors: {
        thaiRed: '#A51931',
        thaiBlue: '#2D2A4A',
        thaiWhite: '#F4F5F8',
      },
    },
  },
  plugins: [],
};

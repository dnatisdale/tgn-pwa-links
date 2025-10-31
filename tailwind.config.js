/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        // This generates the utility class: `font-krub`
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

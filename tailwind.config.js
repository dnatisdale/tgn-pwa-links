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
  // tailwind.config.js
// module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    fontFamily: {
      // DEFAULT for the whole app
      sans: ['Krub', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
    },
    extend: {},
  },
  plugins: [],
    },
  },
};

// postcss.config.cjs
// CommonJS so it works even when "type":"module" is set in package.json
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

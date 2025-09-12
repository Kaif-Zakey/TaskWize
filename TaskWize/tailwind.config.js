// tailwind.config.js
const { withNativeWind } = require("nativewind/tailwind");

module.exports = withNativeWind({
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});

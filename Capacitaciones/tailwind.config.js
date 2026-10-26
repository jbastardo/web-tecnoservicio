/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d8eeff",
          200: "#b9e2fe",
          300: "#89cffe",
          400: "#52b2fc",
          500: "#2a92f7",
          600: "#1473eb",
          700: "#0e5cd7",
          800: "#1249ad",
          900: "#154088",
          950: "#0d2754",
        },
        navy: {
          800: "#0c1524",
          900: "#080e1a",
          950: "#04070d",
        },
      },
    },
  },
  plugins: [],
};

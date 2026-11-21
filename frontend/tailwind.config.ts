import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paddy: {
          50: "#f2f9f1",
          100: "#e1f2e0",
          200: "#c4e5c2",
          300: "#99d196",
          400: "#69b766",
          500: "#449b42",
          600: "#347e33",
          700: "#2b642a",
          800: "#265026",
          900: "#204221",
        },
        kuttanad: {
          water: "#0284c7",
          polder: "#15803d",
          bund: "#b45309",
          saline: "#dc2626",
        }
      },
    },
  },
  plugins: [],
};
export default config;

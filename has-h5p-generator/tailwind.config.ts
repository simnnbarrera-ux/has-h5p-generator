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
        uao: {
          crimson: "#8A1428",
          red: "#AC0B32",
          cyan: "#0099E6",
          soft: "#E0F3FA",
          blue: "#1D5CFF",
          pending: "#FE9800",
          dark: "#0B0F19",
        },
      },
    },
  },
  plugins: [],
};
export default config;

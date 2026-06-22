/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        notion: {
          bg: "#f7f6f3",
          white: "#ffffff",
          hover: "#efefef",
          text: "#37352f",
          gray: "#9ca3af",
          border: "#e5e7eb",
        },
      },
      boxShadow: {
        notion: "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px",
      },
    },
  },
  plugins: [],
};

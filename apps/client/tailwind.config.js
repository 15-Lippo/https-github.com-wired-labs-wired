module.exports = {
  mode: "jit",
  content: ["./pages/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4cc9f0",
        secondary: "#f72585",
      },
      backgroundImage: {
        arrow: "url('/images/arrow.svg')",
      },
      aspectRatio: {
        card: "3/5",
      },
    },
  },
  plugins: [],
};

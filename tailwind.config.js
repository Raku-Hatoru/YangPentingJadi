module.exports = {
  content: ["./templates/**/*.html", "./static/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f0fdf4",
          100: "#dcfce7",
          600: "#16a34a",
          700: "#15803d"
        }
      },
      boxShadow: {
        glow: "0 20px 50px -20px rgba(22, 163, 74, 0.35)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

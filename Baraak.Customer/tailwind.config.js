/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#0B0B0C",
        gold: { DEFAULT: "#C9A227", 600: "#B38E1F", 700: "#8F7118" },
        slateglass: "rgba(0,0,0,0.04)"
      },
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,0.08)" },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-4px)" } }
      },
      animation: { floaty: "floaty 3s ease-in-out infinite" }
    }
  },
  plugins: []   // ← remove line-clamp plugin here
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "deep-green": "#064E3B",
        "primary-green": "#047857",
        "soft-green": "#D1FAE5",
        "pale-green": "#F0FDF4",
        "warm-off-white": "#FAFAF7",
        charcoal: "#1F2937",
        muted: "#6B7280",
        amber: "#F59E0B",
        "risk-red": "#DC2626"
      },
      boxShadow: {
        soft: "0 6px 24px rgba(6, 78, 59, 0.08)"
      },
      fontFamily: {
        heading: ["\"Plus Jakarta Sans\"", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

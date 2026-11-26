/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#1e3a8a',      // Primary Govt Navy
          navyDark: '#0f172a',
          navyLight: '#3b82f6',
          green: '#15803d',     // Agriculture/Harvest Green
          greenDark: '#166534',
          greenLight: '#22c55e',
          saffron: '#ea580c',   // Indian Saffron accent
          saffronLight: '#f97316',
          saffronBg: '#fff7ed',
          gold: '#ca8a04',
          cream: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          textMuted: '#64748b',
          textMain: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

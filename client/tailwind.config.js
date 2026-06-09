/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'stub-black': '#0a0a0a',
        'stub-dark': '#141414',
        'stub-card': '#1a1a1a',
        'stub-border': '#2a2a2a',
        'stub-accent': '#f5a623',
        'stub-accent-dim': '#b87d1a',
        'stub-green': '#22c55e',
        'stub-red': '#ef4444',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'highlight-message': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgb(147 197 253 / 0.3)' }
        }
      },
      animation: {
        'highlight-message': 'highlight-message 2s ease-in-out'
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#121212',
          800: '#1E1E1E',
          700: '#2D2D2D',
          600: '#3D3D3D',
          500: '#4D4D4D',
        }
      },
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
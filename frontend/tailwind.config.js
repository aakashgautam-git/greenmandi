/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        Display: ['Inter', 'sans-serif'],
        Sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#00C853',
        primaryHover: '#00B248',
        surface: '#FFFFFF',
        background: '#FAFBFD',
      },
      boxShadow: {
        'soft': '0 20px 40px rgba(0, 0, 0, 0.04)',
        'btn': '0 8px 16px rgba(0, 200, 83, 0.2)',
      }
    },
  },
  plugins: [],
}

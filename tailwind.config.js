/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'supernova-orange': '#f4600c',
        'cosmic-blue': '#070d1f',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

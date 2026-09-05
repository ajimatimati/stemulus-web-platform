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
        'admin-accent': '#2563eb',
        'admin-border': '#e2e8f0',
        'admin-success': '#16a34a',
        'admin-warning': '#d97706',
        'admin-danger': '#dc2626',
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

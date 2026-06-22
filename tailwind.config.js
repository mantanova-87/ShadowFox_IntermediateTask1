/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/js/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#2563EB',
          DEFAULT: '#2563EB',
        },
        navy: {
          light: '#2E5A8F',
          DEFAULT: '#1E3A5F',
          dark: '#112239',
        },
        teal: {
          DEFAULT: '#0D9488',
        },
        purple: {
          DEFAULT: '#7C3AED',
        },
        amber: {
          DEFAULT: '#D97706',
        },
        rose: {
          DEFAULT: '#E11D48',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

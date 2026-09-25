/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#0d6b3a',
          950: '#052e16',
        },
        fseg: {
          green:  '#0d6b3a',
          dark:   '#0a5230',
          light:  '#e8f5ee',
          gold:   '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      animation: {
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.2s ease-out',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    }
  },
  plugins: []
};

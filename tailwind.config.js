/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'shadow-2xs',
    'shadow-xs',
    'animate-fade-up',
    'animate-fade-in',
    'animate-slide-left',
    'animate-slide-right',
    'animate-scale-in',
    'animate-pulse-green',
    'animate-float',
    'skeleton',
    'card',
    'card-hover',
    'btn-brand',
    'glass',
    'gradient-text',
    'badge-active',
    'badge-pending',
    'badge-cancelled',
    'badge-transit',
    'badge-expired',
    'animate-children',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#15803D',
          deep: '#14532D',
          darkSidebar: '#0F5132',
          tint: '#E8F5EE',
          success: '#16A34A',
          negative: '#DC2626',
          warning: '#F59E0B',
          info: '#2563EB',
          purple: '#6366F1',
          bg: '#F7F8FA',
          border: '#E5E7EB',
        }
      },
      borderRadius: {
        'card': '14px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'xs': '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'brand': '0 4px 20px -4px rgb(21 128 61 / 0.3)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'slide-left': 'slideInLeft 0.35s ease-out both',
        'slide-right': 'slideInRight 0.35s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(21 128 61 / 0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgb(21 128 61 / 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}


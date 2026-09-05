/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
      }
    },
  },
  plugins: [],
}

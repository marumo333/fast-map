/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './app/components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: 'rgb(191, 219, 254)', // より薄い青色
          DEFAULT: 'rgb(96, 165, 250)', // 薄い青色
          dark: 'rgb(59, 130, 246)', // アクセント用の青色
        },
        background: 'rgb(255, 255, 255)',
        text: 'rgb(0, 0, 0)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
} 
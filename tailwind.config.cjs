/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#66BB6A',
          600: '#1B5E20',
          700: '#1B5E20',
          800: '#1B5E20',
          900: '#1B5E20',
          950: '#1B5E20',
          DEFAULT: '#66BB6A',
        },
        gold: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#FBBF24',
        },
        slate: {
          50: '#F7E5EB',
          100: '#F1D7DE',
          200: '#E4B8C3',
          300: '#D39CA8',
          400: '#BA7B88',
          500: '#94626D',
          600: '#6F4756',
          700: '#4C3240',
          800: '#312430',
          900: '#172B4D',
          950: '#0F1D34',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
};

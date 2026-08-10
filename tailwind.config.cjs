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
          50: '#F7E5EB',
          100: '#F4DAE2',
          200: '#E8B8C8',
          300: '#DFA3B7',
          400: '#D089A0',
          500: '#C67A94',
          600: '#B1647C',
          700: '#8E4E62',
          800: '#6D3A4B',
          900: '#4C2940',
          950: '#2D1728',
          DEFAULT: '#E8B8C8',
        },
        gold: {
          50: '#FFF0F4',
          100: '#FDE4EA',
          200: '#F7D0DA',
          300: '#F0B5C3',
          400: '#E89AAE',
          500: '#E0849A',
          600: '#C06B84',
          700: '#98566A',
          800: '#6D3F50',
          900: '#472735',
          DEFAULT: '#E8B8C8',
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

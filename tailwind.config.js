/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        arrival: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(56, 189, 248, 0.2)' },
          '50%': { transform: 'scale(1.03)', boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        waveMiddle: {
          '0%, 100%': { transform: 'translateY(-10px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        waveReverse: {
          '0%, 100%': { transform: 'translateY(-20px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      clipPath: {
        polygon: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      },
      animation: {
        wave: 'wave 1.5s ease-in-out infinite',
        waveMiddle: 'waveMiddle 1.5s ease-in-out infinite',
        waveReverse: 'waveReverse 1.5s ease-in-out infinite',
        arrival: 'arrival 1.5s ease-in-out',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      screens: {
        '900': '900px',
        'xxl': '1920px'
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide'),],
};

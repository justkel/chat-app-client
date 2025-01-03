/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
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
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide'),],
};

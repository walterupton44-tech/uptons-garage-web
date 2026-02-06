module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
export default {
  theme: {
    extend: {
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      keyframes: {
        diagonalMove: {
          '0%': { backgroundPosition: 'top left' },
          '50%': { backgroundPosition: 'bottom right' },
          '100%': { backgroundPosition: 'top left' },
        },
      },
      animation: {
        'diagonal-gradient': 'diagonalMove 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

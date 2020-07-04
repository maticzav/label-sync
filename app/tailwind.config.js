module.exports = {
  purge: ['./components/**/*.tsx', './pages/**/*.tsx'],
  theme: {
    container: {
      center: true,
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
}

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/forms')],
}

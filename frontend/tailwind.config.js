/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      colors: {
        lab: {
          bg: '#f2e8dc',
          surface: '#fbf5ec',
          card: '#ffffff',
          panel: '#ecdfcf',
          border: '#ccb8a0',
          accent: '#d97745',
          accent2: '#326789',
          accent3: '#6f8f72',
          ink: '#0f1722',
          muted: '#4f3d2d',
          glow: 'rgba(217, 119, 69, 0.18)',
        },
      },
      boxShadow: {
        panel: '0 24px 70px -34px rgba(69, 46, 26, 0.22)',
        float: '0 14px 30px -18px rgba(50, 103, 137, 0.28)',
      },
      backgroundImage: {
        'page-wash':
          'radial-gradient(circle at top left, rgba(217,119,69,0.16), transparent 28%), radial-gradient(circle at top right, rgba(50,103,137,0.14), transparent 24%), linear-gradient(180deg, rgba(255,250,244,1) 0%, rgba(247,242,234,1) 55%, rgba(243,235,224,0.85) 100%)',
        lattice:
          'linear-gradient(rgba(80, 55, 31, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(80, 55, 31, 0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          50: '#f0fdf9',
          100: '#e1fbf2',
          200: '#c3f5e5',
          300: '#8eead1',
          400: '#48d5b5',
          500: '#2fb49c', // Core Logo Aquamarine Seafoam
          600: '#239380',
          700: '#1d7467',
          800: '#1b5e54',
          900: '#0f3d38', // Deep Forest Emerald/Teal
          950: '#082522',
        },
        gold: {
          50: '#fdf8ef',
          100: '#f9ecd4',
          200: '#f2d38a',
          300: '#e8b84a',
          400: '#c9933c',
          500: '#a67c2e',
          600: '#8b6520',
          700: '#7a4b1d',
          800: '#5e3a15',
          900: '#3d250e',
        },
        cream: {
          50: '#fffdf8',
          100: '#fffaf0',
          200: '#fff7e9',
          300: '#f8f1e4',
          400: '#f0e5d0',
          500: '#e0d1b8',
          600: '#c4b08e',
          700: '#a08a64',
        },
        ink: {
          50: '#f5f5f5',
          100: '#e0ddd8',
          200: '#b3aca0',
          300: '#8a8172',
          400: '#776b58',
          500: '#5a5044',
          600: '#3d3530',
          700: '#201c18',
          800: '#120f0c',
          900: '#080604',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9933c 0%, #a67c2e 100%)',
        'gold-light-gradient': 'linear-gradient(135deg, #f2d38a, #c9933c 58%, #8b561f)',
        'hero-gradient': 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.3) 100%)',
        'warm-gradient': 'linear-gradient(180deg, rgba(255,250,240,0.94), rgba(248,241,228,0.98))',
        'warm-radial': 'radial-gradient(circle at 50% 0%, rgba(201,147,60,0.18), transparent 38%)',
      },
      boxShadow: {
        'warm': '0 24px 70px rgba(8, 6, 4, 0.18)',
        'warm-sm': '0 4px 20px rgba(8, 6, 4, 0.08)',
        'warm-lg': '0 22px 54px rgba(8, 6, 4, 0.12)',
        'gold': '0 8px 30px rgba(201, 147, 60, 0.35)',
        'gold-hover': '0 12px 40px rgba(201, 147, 60, 0.45)',
        'card': '0 2px 16px rgba(8, 6, 4, 0.06)',
        'card-hover': '0 12px 40px rgba(8, 6, 4, 0.12)',
      },
      animation: {
        'shine': 'shine 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

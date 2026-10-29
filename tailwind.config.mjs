const token = (name) => `rgb(var(--mega-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
    extend: {
      colors: {
        mega: {
          orange: token('orange'),
          'orange-dark': token('orange-dark'),
          blue: token('blue'),
          'blue-electric': token('blue-electric'),
          navy: token('navy'),
          gray: token('gray'),
          'gray-dark': token('gray-dark'),
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        field: '0.875rem', // 14px
        card: '1.5rem', // 24px
        hero: '2rem', // 32px
        pill: '9999px',
      },
      boxShadow: {
        card: '0 8px 24px -8px rgb(7 21 46 / 0.14)',
        'card-hover': '0 18px 36px -12px rgb(7 21 46 / 0.25)',
        cta: '0 6px 0 rgb(var(--mega-orange-dark))',
        'hard-orange': '0 6px 0 rgb(var(--mega-orange-dark))',
        'hard-navy': '0 6px 0 rgb(var(--mega-navy))',
        'hard-card': '0 8px 0 rgb(7 21 46 / 0.15)',
        'hard-white': '0 6px 0 rgba(255, 255, 255, 0.4)',
      },
    },
  },
  plugins: [],
};

import typography from '@tailwindcss/typography'

const brand = {
  DEFAULT: '#0870f8',
  dark: '#0055c8',
  soft: '#e9f3ff'
}

export default {
  darkMode: 'class',
  content: ['./app/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        brand,
        ink: '#0c1424',
        muted: '#61708a',
        line: '#dfe6f0',
        soft: '#f4f7fb',
        navy: '#07111f'
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.5rem',
        md: '0.5rem',
        lg: '0.5rem',
        xl: '0.5rem',
        '2xl': '0.5rem',
        '3xl': '0.5rem',
        full: '9999px'
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        geist: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    }
  },
  plugins: [typography]
}

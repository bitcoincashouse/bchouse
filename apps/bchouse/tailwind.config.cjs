const path = require('path')
const plugin = require('tailwindcss/plugin')

module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    path.join(__dirname, '/app/**/*.{html,ts,tsx}'),
    path.join(
      path.dirname(require.resolve('tailwind-datepicker-react')),
      '/**/*.js'
    ),
    path.join(
      path.dirname(require.resolve('@bchouse/cashconnect')),
      '/**/*.js'
    ),
  ],
  darkMode: 'class',
  // safelist: process.env.NODE_ENV === "development" ? [{ pattern: /.*stretch.*/ }]  : [],
  theme: {
    screens: {
      xs: '380px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    darkMode: 'class',
    extend: {
      backgroundColor: {
        primary: 'rgb(var(--color-bg-primary) / <alpha-value>)',
        hover: 'rgb(var(--color-hover-primary) / <alpha-value>)',
        'hover-secondary': 'rgb(var(--color-hover-secondary) / <alpha-value>)',
      },
      gridTemplateColumns: {
        fluid: 'repeat(auto-fit, minmax(20rem, 1fr))',
      },
      fontSize: {
        '4xl': '2.1875rem',
      },
      transitionProperty: {
        height: 'height',
        'slide-in-bottom': 'opacity, translateY',
      },
      screens: {
        sm: '640px',
        'non-mobile': '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        xxl: '1440px',
        desktop: '990px',
      },
      colors: {
        // primary: 'rgb(var(--color-primary) / <alpha-value>)',
        // text: 'rgb(var(--color-text) / <alpha-value>)',
        // success: 'rgb(var(--color-success) / <alpha-value>)',
        // info: 'rgb(var(--color-info) / <alpha-value>)',
        // warn: 'rgb(var(--color-warn) / <alpha-value>)',
        // error: 'rgb(var(--color-error) / <alpha-value>)',
        // transparent: 'transparent',
        // current: 'currentColor',
        'wcm-color-1': 'var(--wcm-color-bg-1)',
        'wcm-fg-color-1': 'var(--wcm-color-bg-1)',
        hover: 'rgb(var(--color-hover-primary) / <alpha-value>)',
        'hover-secondary': 'rgb(var(--color-hover-secondary) / <alpha-value>)',

        'primary-text': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'secondary-text': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        bch: '#0ac18e',
        blueGreen: '#34797D',
        blueGreenScreen: '#66989a',
        blueGreenLight: '#6BC4CE',
        deepBlue: '#002256',
        plBlack: '#16161F',
        navy: '#0B3A53',
        gray: {
          background: '#f1f3f2',
          light: '#b7c0c3',
        },
        'primary-btn': {
          50: '#E3F3FD',
          100: '#C7E7FA',
          200: '#89CEF5',
          300: '#51B6F0',
          400: '#149CEB',
          500: '#0F77B3',
          600: '#0A4F76',
          700: '#083B59',
          800: '#05293D',
          900: '#02131C',
          950: '#01090E',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: 'inter, sans-serif',
        serif: 'source-serif-pro, serif',
        display: 'montserrat, sans-serif',
        readable: 'Cantarell, sans-serif',
        cairo: 'Cairo',
        wcm: "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', sans-serif",
      },
      fontSize: {
        12: '0.75rem',
        14: '0.875rem',
        16: '1rem',
        18: '1.125rem',
        20: '1.25rem',
        22: '1.375rem',
        24: '1.5rem',
        28: '1.75rem',
        35: '2.1875rem',
        50: '3.125rem',
      },
      letterSpacing: {
        tight: '-0.01em',
      },
      lineHeight: {
        120: '1.2',
        130: '1.3',
        140: '1.4',
        150: '1.5',
      },
      minHeight: {
        300: '18.75rem',
        640: '40rem',
      },
      maxHeight: {
        168: '42rem',
        1200: '75rem',
      },
      spacing: {
        '15px': '15px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.plBlack'),
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: theme('fontFamily.sans'),
            fontWeight: theme('fontWeight.normal'),
            fontSize: theme('fontSize.15'),
            letterSpacing: theme('letterSpacing.normal'),
            lineHeight: theme('lineHeight.140'),
            '@screen sm': {
              fontSize: theme('fontSize.15'),
              lineHeight: theme('lineHeight.150'),
            },
            h1: {
              fontFamily: theme('fontFamily.display'),
              lineHeight: theme('lineHeight.120'),
              fontWeight: theme('fontWeight.medium'),
              letterSpacing: theme('letterSpacing.tight'),
              fontSize: theme('fontSize.35'),
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #d1d1d663',
              '@screen lg': {
                fontSize: theme('fontSize.50'),
              },
            },
            h2: {
              fontSize: theme('fontSize.28'),
              lineHeight: theme('lineHeight.120'),
              fontFamily: theme('fontFamily.display'),
              fontWeight: theme('fontWeight.medium'),
              letterSpacing: theme('letterSpacing.tight'),
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #d1d1d663',
              '@screen sm': {
                fontSize: theme('fontSize.34'),
                lineHeight: theme('lineHeight.120'),
              },
            },
            h3: {
              fontFamily: theme('fontFamily.display'),
              fontWeight: theme('fontWeight.medium'),
              fontSize: theme('fontSize.28'),
              letterSpacing: theme('letterSpacing.tight'),
              lineHeight: theme('lineHeight.120'),
              marginTop: '1.5em',
              marginBottom: '1em',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #d1d1d663',
            },
            h4: {
              fontFamily: theme('fontFamily.sans'),
              fontWeight: theme('fontWeight.normal'),
              fontSize: '1.3rem',
              letterSpacing: theme('letterSpacing.normal'),
              lineHeight: theme('lineHeight.130'),
              marginTop: '1.2em',
            },
            h5: {
              fontFamily: theme('fontFamily.display'),
              fontWeight: theme('fontWeight.semibold'),
              fontSize: theme('fontSize.18'),
              letterSpacing: theme('letterSpacing.tight'),
              lineHeight: theme('lineHeight.130'),
              '@screen sm': {
                fontSize: theme('fontSize.22'),
              },
            },
            a: {
              fontWeight: theme('fontWeight.bold'),
              color: theme('colors.blueGreen'),
              textDecoration: 'none',
              wordWrap: 'break-word',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.deepBlue'),
            },
            code: {
              backgroundColor: 'rgba(27, 31, 35, 0.05)',
              borderRadius: '0.1875rem',
              color: 'rgba(51, 51, 51, 0.8)',
              fontSize: theme('fontSize.14'),
              fontWeight: theme('fontWeight.normal'),
              padding: '.15rem .3rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              '&::before': {
                content: 'none !important',
              },
              '&::after': {
                content: 'none !important',
              },
            },
            pre: {
              '&[class*="language-"]': {
                backgroundColor: '#0e2333',
                color: '#fff',
                fontSize: theme('fontSize.14'),
                overflowX: 'auto',
                padding: '1.2rem 1.5rem',
                textShadow: 'none',
              },
            },
            ul: {
              '& li::before': {
                backgroundColor: theme('colors.plBlack'),
              },
            },
            ol: {
              '> li::before': {
                color: theme('colors.plBlack'),
              },
            },
          },
        },
      }),
      //shad-cn
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  variants: {
    margin: ['responsive', 'first', 'last'],
    extend: {
      backgroundColor: ['group-hover'],
      hidden: ['group-focus-within'],
    },
  },
  plugins: [
    // require('@tailwindcss/container-queries'),
    // require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('./tailwind.gradients'),
    require('tailwindcss-animate'),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'translate-z': (value) => ({
            '--tw-translate-z': value,
            transform: ` translate3d(var(--tw-translate-x), var(--tw-translate-y), var(--tw-translate-z)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))`,
          }), // this is actual CSS
        },
        { values: theme('translate'), supportsNegativeValues: true }
      )
    }),
  ],
}

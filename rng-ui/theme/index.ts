'use client';

import { createTheme, alpha } from '@mui/material/styles';
import { Roboto, Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

/**
 * 👑 RNG Enterprise Theme
 * Optimized for high-density ERP data, accessibility, and modern aesthetics.
 */
const RNGTheme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0052CC', // Enterprise Blue
          light: '#DEEBFF',
          dark: '#0747A6',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#6554C0', // Royal Purple
          light: '#EAE6FF',
          dark: '#5243AA',
        },
        success: {
          main: '#36B37E', // Fresh Green
          light: '#E3FCEF',
          dark: '#006644',
        },
        warning: {
          main: '#FFAB00', // Alert Amber
          light: '#FFFAE6',
          dark: '#FF8B00',
        },
        error: {
          main: '#FF5630', // Crisis Red
          light: '#FFEBE6',
          dark: '#BF2600',
        },
        info: {
          main: '#00B8D9', // Info Cyan
          light: '#E6FCFF',
          dark: '#008DA6',
        },
        background: {
          default: '#F4F5F7',
          paper: '#FFFFFF',
        },
        text: {
          primary: '#172B4D',
          secondary: '#6B778C',
        },
        divider: 'rgba(9, 30, 66, 0.08)',
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#4C9AFF',
          light: '#0747A6',
          dark: '#DEEBFF',
        },
        background: {
          default: '#091E42',
          paper: '#172B4D',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B3BAC5',
        },
        divider: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 700 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontSize: '1rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.57 },
    caption: { fontSize: '0.75rem', fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0747A6',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid var(--mui-palette-divider)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderBottom: '1px solid var(--mui-palette-divider)',
        },
        head: {
          fontWeight: 700,
          backgroundColor: 'var(--mui-palette-action-hover)',
          color: 'var(--mui-palette-text-secondary)',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default RNGTheme;

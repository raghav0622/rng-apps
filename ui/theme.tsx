'use client';
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  cssVariables: {
    colorSchemeSelector: 'class', // This matches InitColorSchemeScript attribute="class"
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  components: {
    // Polish: Default Card styles for better consistency
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient in dark mode for cleaner look
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
          border: '1px solid var(--mui-palette-divider)',
        },
      },
    },
  },
});

export default theme;

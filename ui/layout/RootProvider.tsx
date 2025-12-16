'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import theme from '@/ui/theme';
import BaseLayout from './BaseLayout';

export default function RootProvider(props: { children: React.ReactNode }) {
  return (
    <>
      <InitColorSchemeScript attribute="class" />
      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BaseLayout>{props.children}</BaseLayout>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </>
  );
}

'use client';
import { LayoutProvider } from '@/ui/layout/LayoutContext';
import theme from '@/ui/theme';
import { Close as CloseIcon } from '@mui/icons-material';
import { Box, CssBaseline, IconButton, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import NextTopLoader from 'nextjs-toploader'; // <--- Import
import { SnackbarKey, SnackbarProvider } from 'notistack';
import { useRef } from 'react';

interface AppProviderProps {
  children: React.ReactNode;
}

function AppProvider({ children }: AppProviderProps) {
  const snackbarRef = useRef<SnackbarProvider>(null);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Fixes broken browser default styles */}
        <NextTopLoader
          color={theme.palette.primary.main}
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false} // Clean UX: Bar only, no spinner
          easing="ease"
          speed={200}
          shadow={`0 0 10px ${theme.palette.primary.main},0 0 5px ${theme.palette.primary.main}`}
        />
        <SnackbarProvider
          ref={snackbarRef}
          maxSnack={3}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          // Global action to make all snackbars closable
          action={(key: SnackbarKey) => (
            <IconButton
              onClick={() => snackbarRef.current?.closeSnackbar(key)}
              size="small"
              color="inherit"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        >
          <LayoutProvider>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
              }}
            >
              {children}
            </Box>
          </LayoutProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

export default AppProvider;

import { Box } from '@mui/material';
import * as React from 'react';
import DrawerContent from '../DrawerContent';
import { AppContent } from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';
import { LayoutContextProvider } from './LayoutContext';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutContextProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppHeader />
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <AppDrawer>
            <DrawerContent />
          </AppDrawer>
          <AppContent>{children}</AppContent>
        </Box>
      </Box>
    </LayoutContextProvider>
  );
}

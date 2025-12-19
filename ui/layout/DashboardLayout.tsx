import { Box } from '@mui/material';
import * as React from 'react';
import DrawerContent from '../DrawerContent';
import { AppContent } from './AppContent';
import AppDrawer from './AppDrawer';
import AppHeader from './AppHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <AppDrawer>
          <DrawerContent />
        </AppDrawer>
        <AppContent>{children}</AppContent>
      </Box>
    </Box>
  );
}

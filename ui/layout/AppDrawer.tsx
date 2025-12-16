import { Stack, Toolbar } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import * as React from 'react';
import { useLayoutContext } from './LayoutContext';

export default function AppDrawer({ children }: { children: React.ReactNode }) {
  const { mobile, drawerOpen, handleDrawerClose, handleDrawerTransitionEnd, drawerWidth, padding } =
    useLayoutContext();
  return (
    <Drawer
      variant={mobile ? 'temporary' : 'persistent'}
      open={drawerOpen}
      onClose={handleDrawerClose}
      onTransitionEnd={handleDrawerTransitionEnd}
      sx={{
        display: mobile ? { xs: 'block', sm: 'none' } : { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
      }}
      slotProps={{
        root: {
          keepMounted: true, // Better open performance on mobile.
        },
      }}
    >
      <Stack gap={padding}>
        <Toolbar variant="dense" sx={{ marginBottom: -1 * padding }} />
        {children}
      </Stack>
    </Drawer>
  );
}

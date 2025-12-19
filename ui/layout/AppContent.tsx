'use client';

import { Box, Toolbar, styled } from '@mui/material';
import { useLayoutContext } from './LayoutContext';

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth',
})<{
  open?: boolean;
  drawerWidth: number;
}>(({ theme, open, drawerWidth }) => ({
  flexGrow: 1,
  padding: theme.spacing(3), // Increased padding for better breathing room
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
    [theme.breakpoints.up('sm')]: {
      marginLeft: `${drawerWidth}px`,
    },
  }),
}));

export const AppContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { drawerWidth, drawerOpen, mobile } = useLayoutContext();

  return (
    <Main open={!mobile && drawerOpen} drawerWidth={drawerWidth}>
      {/* Spacer to push content below fixed header */}
      <Toolbar variant="dense" />
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '1600px', mx: 'auto' }}
      >
        {children}
      </Box>
    </Main>
  );
};

'use client';

import { Box, styled } from '@mui/material';
import React from 'react';
import { useLayoutContext } from './LayoutContext';

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth',
})<{
  open?: boolean;
  drawerWidth: number;
}>(({ theme, open, drawerWidth }) => ({
  flexGrow: 1,
  width: '100%',
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.up('sm')]: {
      // marginLeft: `${drawerWidth}px`,
      // width: `calc(100% - ${drawerWidth}px)`,
    },
  }),
}));

const AppContent: React.FC<{ children: React.ReactNode; drawerDisabled?: boolean }> = ({
  children,
  drawerDisabled = false,
}) => {
  const { drawerWidth, drawerOpen, mobile } = useLayoutContext();

  // The drawer pushes content only if it's NOT mobile and it IS open.
  const isShifted = !drawerDisabled && !mobile && drawerOpen;

  return (
    <Main open={isShifted} drawerWidth={drawerWidth}>
      {/* Spacer to push content below fixed header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 4 }}>{children}</Box>
    </Main>
  );
};

export default AppContent;

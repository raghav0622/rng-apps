'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import React, { createContext, useContext, useEffect, useState } from 'react';

type LayoutCtx = {
  drawerWidth: number;
  padding: number;
  handleDrawerToggle: () => void;
  handleDrawerTransitionEnd: () => void;
  handleDrawerClose: () => void;
  drawerOpen: boolean;
  mobile: boolean;
};

const LayoutContext = createContext<LayoutCtx | undefined>(undefined);

export const useLayoutContext = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return ctx;
};

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  // Using 'down(md)' is safer for mobile drawers (includes tablets in portrait),
  // but keeping 'only(xs)' as per your specific request for "mobile".
  const mobile = useMediaQuery(theme.breakpoints.only('xs'));

  const drawerWidth = 250;
  const padding = 2;

  // Initialize state. Note: !mobile means open on desktop by default.
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isDrawerClosing, setDrawerIsClosing] = useState(false);

  // Sync drawer state with screen size changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(!mobile);
  }, [mobile]);

  const handleDrawerClose = () => {
    setDrawerIsClosing(true);
    setDrawerOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setDrawerIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isDrawerClosing) {
      setDrawerOpen((prev) => !prev);
    }
  };

  return (
    <LayoutContext.Provider
      value={{
        drawerWidth,
        padding,
        handleDrawerToggle,
        handleDrawerTransitionEnd,
        handleDrawerClose,
        drawerOpen,
        mobile,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

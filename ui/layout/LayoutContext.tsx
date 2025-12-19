'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import React, { createContext, useContext, useState } from 'react';

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
    throw new Error('useLayoutContext must be used within a LayoutContextProvider');
  }
  return ctx;
};

export const LayoutContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.only('xs'));
  const drawerWidth = 250;
  const padding = 2;
  const [drawerOpen, setDrawerOpen] = useState(!!!mobile);
  const [isDrawerClosing, setDrawerIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setDrawerIsClosing(true);
    setDrawerOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setDrawerIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isDrawerClosing) {
      setDrawerOpen(!drawerOpen);
    }
  };

  return (
    <LayoutContext
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
    </LayoutContext>
  );
};

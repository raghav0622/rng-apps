'use client';
import { Box, Container, Paper, Tab, Tabs } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getTabValue = () => {
    if (pathname.includes('/basic')) return 0;
    if (pathname.includes('/logic')) return 1;
    if (pathname.includes('/wizard')) return 2;
    if (pathname.includes('/layout')) return 3;
    return 0;
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ mb: 4 }}>
        <Tabs value={getTabValue()} variant="scrollable" scrollButtons="auto">
          <Tab label="Basic Inputs" component={Link} href="/playground/basic" />
          <Tab label="Logic & Arrays" component={Link} href="/playground/logic" />
          <Tab label="Wizard Flow" component={Link} href="/playground/wizard" />
          <Tab label="Complex Layouts" component={Link} href="/playground/layout" />
        </Tabs>
      </Paper>
      <Box sx={{ minHeight: '60vh' }}>{children}</Box>
    </Container>
  );
}

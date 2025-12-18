'use client';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box px={4}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Link href="/playground" style={{ textDecoration: 'none', color: 'inherit' }}>
              RNG Form
            </Link>
          </Typography>
          <Button component={Link} href="/playground/basic">
            Basic
          </Button>
          <Button component={Link} href="/playground/layouts">
            Layouts
          </Button>
          <Button component={Link} href="/playground/logic">
            Logic
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 0 }}>{children}</Box>
    </Box>
  );
}

'use client';

import { logoutAction } from '@/features/auth/auth.actions';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
// Replace with your actual logout server action or firebase utility

export default function LogoutPage() {
  const router = useRouter();
  // Ref to prevent double-firing in React Strict Mode during dev
  const hasCalledLogout = useRef(false);

  useEffect(() => {
    const performLogout = async () => {
      // Prevent running twice
      if (hasCalledLogout.current) return;
      hasCalledLogout.current = true;

      try {
        // 1. Call your logout logic (Server Action or Firebase SignOut)
        await logoutAction();

        // Optional: specific delay if you want the user to read the message
        // await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Logout failed:', error);
        // Even if the API call fails, we usually want to force the UI
        // to redirect to login to clear the state visually.
      } finally {
        // 2. Redirect to Login or Home
        // .replace prevents the user from clicking "Back" to return to this loading page
        router.replace('/login');
        router.refresh(); // Ensure server components re-render with new auth state
      }
    };

    performLogout();
  }, [router]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        <CircularProgress size={60} thickness={4} color="primary" />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" component="h1" gutterBottom fontWeight="600">
            Logging you out...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we clear your session.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

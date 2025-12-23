'use client';

import { Box, Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';

interface AuthNavigationProps {
  mode: 'login' | 'signup' | 'forgot-password';
}

export const AuthNavigation = ({ mode }: AuthNavigationProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
      {mode === 'login' && (
        <>
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{' '}
            <MuiLink component={Link} href="/signup" underline="hover" fontWeight="500">
              Sign up
            </MuiLink>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <MuiLink component={Link} href="/forgot-password" underline="hover" fontWeight="500">
              Forgot password?
            </MuiLink>
          </Typography>
        </>
      )}

      {mode === 'signup' && (
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <MuiLink component={Link} href="/login" underline="hover" fontWeight="500">
            Sign in
          </MuiLink>
        </Typography>
      )}

      {mode === 'forgot-password' && (
        <Typography variant="body2" color="text.secondary">
          Remember your password?{' '}
          <MuiLink component={Link} href="/login" underline="hover" fontWeight="500">
            Sign in
          </MuiLink>
        </Typography>
      )}
    </Box>
  );
};

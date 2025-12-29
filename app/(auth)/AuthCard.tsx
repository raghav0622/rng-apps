import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import { Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface RNGAuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: boolean;
}

/**
 * 🎨 RNGAuthCard
 * A standardized layout card for authentication pages (Login, Signup, Forgot Password).
 * Provides consistent branding, messaging, and navigation links.
 */
export const AuthCard = ({ title, description, children, footer = false }: RNGAuthCardProps) => {
  const path = usePathname();
  return (
    <RNGPage title={title} description={description} maxWidth="xs">
      {children}

      {footer && (
        <Stack gap={2} direction={'row'} alignItems={'center'} justifyContent={'center'} mt={3}>
          {path === '/login' && (
            <>
              <MuiLink component={Link} href="/signup" underline="hover" variant="body2">
                Sign up
              </MuiLink>
              <Typography variant="body2" color="text.secondary">
                |
              </Typography>
              <MuiLink component={Link} href="/forgot-password" underline="hover" variant="body2">
                Forgot Password?
              </MuiLink>
            </>
          )}
          {path === '/signup' && (
            <>
              <MuiLink component={Link} href="/login" underline="hover" variant="body2">
                Login
              </MuiLink>
              <Typography variant="body2" color="text.secondary">
                |
              </Typography>
              <MuiLink component={Link} href="/forgot-password" underline="hover" variant="body2">
                Forgot Password?
              </MuiLink>
            </>
          )}
          {path === '/forgot-password' && (
            <>
              <MuiLink component={Link} href="/login" underline="hover" variant="body2">
                Back to Login
              </MuiLink>
            </>
          )}
        </Stack>
      )}
    </RNGPage>
  );
};

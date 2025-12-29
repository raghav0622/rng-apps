import { Container, Link as MuiLink, Stack, Typography } from '@mui/material';
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
export const RNGAuthCard = ({ title, description, children, footer = false }: RNGAuthCardProps) => {
  const path = usePathname();
  return (
    <Container maxWidth="xs">
      <Stack gap={3} sx={{ py: 6, alignItems: 'center' }}>
        <Stack alignItems={'center'} justifyContent={'center'} mb={3}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {description}
          </Typography>
        </Stack>

        {children}

        {footer && (
          <Stack gap={2} direction={'row'} alignItems={'center'} justifyContent={'center'} mt={3}>
            {path === '/login' && (
              <>
                <MuiLink component={Link} href="/signup" underline="hover" variant="body2">
                  Sign up
                </MuiLink>
                <Typography variant="body2" color="text.secondary">|</Typography>
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
                <Typography variant="body2" color="text.secondary">|</Typography>
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
      </Stack>
    </Container>
  );
};

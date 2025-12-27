// ui/auth/AuthCard.tsx
import { Container, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: boolean;
}

export const AuthCard = ({ title, description, children, footer = false }: AuthCardProps) => {
  const path = usePathname();
  return (
    <Container maxWidth="xs">
      <Stack gap={3}>
        <Stack alignItems={'center'} justifyContent={'center'}>
          <Typography variant="h4" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {description}
          </Typography>
        </Stack>

        {children}

        {footer && (
          <Stack gap={2} direction={'row'} alignItems={'center'} justifyContent={'center'}>
            {path == '/login' && (
              <>
                <MuiLink component={Link} href="/signup" underline="hover">
                  Sign up
                </MuiLink>
                {' | '}
                <MuiLink component={Link} href="/forgot-password" underline="hover">
                  Forgot Password?
                </MuiLink>
              </>
            )}
            {path == '/signup' && (
              <>
                <MuiLink component={Link} href="/login" underline="hover">
                  Login
                </MuiLink>
                {' | '}
                <MuiLink component={Link} href="/forgot-password" underline="hover">
                  Forgot Password?
                </MuiLink>
              </>
            )}
            {path == '/forgot-password' && (
              <>
                <MuiLink component={Link} href="/login" underline="hover">
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

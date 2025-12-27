import { getCurrentUser } from '@/core/auth/auth.actions';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { Box, Container, Stack, Typography } from '@mui/material';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUser({ strictOrg: false });

  if (user.orgId) redirect(DEFAULT_LOGIN_REDIRECT);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          p: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Welcome to RNG App
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let&apos;s get you set up.
            </Typography>
          </Box>
          {children}
        </Stack>
      </Box>
    </Container>
  );
}

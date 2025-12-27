import { Box, Container, Stack, Typography } from '@mui/material';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
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

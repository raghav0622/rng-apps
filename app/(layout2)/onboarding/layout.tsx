import Logo from '@/ui/Logo'; // Assuming you have a Logo component
import { Box, Container, Paper } from '@mui/material';
import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 8,
        pb: 4,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Logo />
      </Box>

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
}

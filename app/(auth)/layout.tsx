import { Container, Paper } from '@mui/material';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {children}
        </Paper>
      </Container>
    </AuthLayout>
  );
}

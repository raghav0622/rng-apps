import AuthLayout from '@/ui/layout/AuthLayout';
import { Container, Paper } from '@mui/material';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout>
      <Container maxWidth="sm" sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {children}
        </Paper>
      </Container>
    </AuthLayout>
  );
}

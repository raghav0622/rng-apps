// ui/auth/AuthCard.tsx
import { Box, Card, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthCard = ({ title, description, children, footer }: AuthCardProps) => {
  return (
    <>
      <Card
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 480,
          mx: 'auto',
          boxShadow: (t) => t.shadows[20],
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Box>

        {children}

        {footer && (
          <Box
            sx={{ mt: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {footer}
          </Box>
        )}
      </Card>
    </>
  );
};

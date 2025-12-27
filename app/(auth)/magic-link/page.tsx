'use client';

import { verifyMagicLinkAction } from '@/core/auth/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Box, CircularProgress, Container, Typography, Alert } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function MagicLinkHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { runAction, error } = useRNGServerAction(verifyMagicLinkAction);

  useEffect(() => {
    if (token) {
      runAction({ token });
    }
  }, [token, runAction]);

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Alert severity="error">Invalid magic link. Missing token.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          <CircularProgress size={60} sx={{ mb: 4 }} />
          <Typography variant="h5" gutterBottom>
            Verifying your magic link...
          </Typography>
          <Typography color="text.secondary">
            You will be redirected shortly.
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>}>
      <MagicLinkHandler />
    </Suspense>
  );
}

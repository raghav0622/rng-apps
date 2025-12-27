'use client';

import { verifyMagicLinkAction } from '@/core/auth/auth.actions';
import { MagicLinkResult } from '@/core/auth/auth.service';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function MagicLinkHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [passwordRequired, setPasswordRequired] = useState<{
    email: string;
    token: string;
  } | null>(null);
  const [password, setPassword] = useState('');

  const { runAction, isExecuting, result } = useRNGServerAction(verifyMagicLinkAction);

  // Safely extract error from next-safe-action result object
  const serverError = result.serverError ? (result.serverError as any).message : null;

  useEffect(() => {
    // Only run if we have a token and haven't already moved to the password-required state
    if (token && !passwordRequired && !serverError) {
      runAction({ token }).then((res) => {
        const data = res as MagicLinkResult | undefined;
        if (data && data.type === 'password_required') {
          setPasswordRequired({ email: data.email, token: data.token });
        } else if (data && data.type === 'success') {
          router.push(DEFAULT_LOGIN_REDIRECT);
        }
      });
    }
  }, [token, runAction, router, passwordRequired, serverError]);

  const handleCompleteRegistration = async () => {
    if (!passwordRequired || !password) return;
    const res = await runAction({
      token: passwordRequired.token,
      password,
    });

    const data = res as MagicLinkResult | undefined;
    if (data && data.type === 'success') {
      router.push(DEFAULT_LOGIN_REDIRECT);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Alert severity="error">Invalid magic link. Missing token.</Alert>
      </Container>
    );
  }

  if (passwordRequired) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Box
          sx={{ p: 4, border: 1, borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}
        >
          <Typography variant="h5" gutterBottom>
            Welcome to RNG App!
          </Typography>
          <Typography color="text.secondary" paragraph>
            Set a password for <strong>{passwordRequired.email}</strong> to finish creating your
            account.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            placeholder="At least 6 characters"
            autoFocus
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleCompleteRegistration}
            disabled={isExecuting || password.length < 6}
          >
            {isExecuting ? 'Creating Account...' : 'Finish Signup'}
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
      {serverError ? (
        <Alert severity="error">{serverError}</Alert>
      ) : (
        <Box>
          <CircularProgress size={60} sx={{ mb: 4 }} />
          <Typography variant="h5" gutterBottom>
            Verifying your magic link...
          </Typography>
          <Typography color="text.secondary">You will be redirected shortly.</Typography>
        </Box>
      )}
    </Container>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      }
    >
      <MagicLinkHandler />
    </Suspense>
  );
}

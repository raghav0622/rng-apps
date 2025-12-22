'use client';

import { useRNGServerAction } from '@/lib/use-rng-action';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { verifyEmailAction } from '../actions/security.actions';

export function VerifyEmailView({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const hasExecuted = useRef(false);
  const { runAction, status, result } = useRNGServerAction(verifyEmailAction);

  useEffect(() => {
    if (oobCode && !hasExecuted.current) {
      hasExecuted.current = true;
      runAction({ oobCode });
    }
  }, [oobCode, runAction]);

  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        {status === 'executing' && (
          <Box>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Verifying your email...</Typography>
          </Box>
        )}

        {status === 'hasSucceeded' && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Email verified successfully!
            </Alert>
            <Button variant="contained" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </Box>
        )}

        {status === 'hasErrored' && (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              {result?.serverError || 'Verification failed. The link may have expired.'}
            </Alert>
            <Button variant="outlined" onClick={() => router.push('/login')}>
              Back to Login
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { authClient } from '@/core/auth/auth.client';
import { googleSignInAction } from '@/core/auth/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Button } from '@mui/material';

export function GoogleSignInButton() {
  const { runAction: serverSignIn, isExecuting } = useRNGServerAction(googleSignInAction);

  const handleGoogleSignIn = async () => {
    try {
      const { idToken } = await authClient.signInWithGoogle();
      await serverSignIn({ idToken });
    } catch (error: any) {
      // Errors handled by safe-action or ignored if user closes popup
    }
  };

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      startIcon={<GoogleIcon />}
      onClick={handleGoogleSignIn}
      disabled={isExecuting}
      sx={{ mb: 2 }}
    >
      {isExecuting ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
}

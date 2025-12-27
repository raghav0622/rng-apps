'use client';

import { authClient } from '@/core/auth/auth.client';
import { googleSignInAction } from '@/core/auth/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Button, CircularProgress, Box, Typography, TextField } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export function GoogleSignInButton() {
  const router = useRouter();
  const [passwordRequired, setPasswordRequired] = useState<{ idToken: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  
  const { runAction: serverSignIn, isExecuting } = useRNGServerAction(googleSignInAction);

  const handleGoogleSignIn = async () => {
    try {
      const { idToken } = await authClient.signInWithGoogle();
      const res = await serverSignIn({ idToken });
      
      if (res?.type === 'password_required') {
        setPasswordRequired({ idToken, email: res.email });
      } else if (res?.type === 'success') {
        router.push(DEFAULT_LOGIN_REDIRECT);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!passwordRequired || !password) return;
    const res = await serverSignIn({ 
      idToken: passwordRequired.idToken, 
      password 
    });
    
    if (res?.type === 'success') {
      router.push(DEFAULT_LOGIN_REDIRECT);
    }
  };

  if (passwordRequired) {
    return (
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Almost there! Complete your registration.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Set a password for your account <strong>{passwordRequired.email}</strong>
        </Typography>
        <TextField
          fullWidth
          size="small"
          type="password"
          label="Choose Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button 
          fullWidth 
          variant="contained" 
          onClick={handleCompleteRegistration}
          disabled={isExecuting || password.length < 6}
        >
          {isExecuting ? 'Creating Account...' : 'Complete Signup'}
        </Button>
      </Box>
    );
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      size="large"
      startIcon={isExecuting ? <CircularProgress size={20} /> : <GoogleIcon />}
      onClick={handleGoogleSignIn}
      disabled={isExecuting}
      sx={{ mb: 2 }}
    >
      {isExecuting ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
}

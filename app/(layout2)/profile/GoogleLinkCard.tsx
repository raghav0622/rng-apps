'use client';

import { authClient } from '@/core/auth/auth.client';
import { linkGoogleAction } from '@/core/auth/auth.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';

export function GoogleLinkCard() {
  const { runAction: serverLink, isExecuting } = useRNGServerAction(linkGoogleAction, {
    successMessage: 'Google account linked successfully',
  });

  const handleLink = async () => {
    try {
      const { idToken } = await authClient.linkGoogle();
      await serverLink({ idToken });
    } catch (error: any) {
      console.error('Link Error:', error);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Social Accounts</Typography>
            <Typography variant="body2" color="text.secondary">
              Link your Google account for faster sign-in.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleLink}
            disabled={isExecuting}
          >
            {isExecuting ? 'Linking...' : 'Link Google'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

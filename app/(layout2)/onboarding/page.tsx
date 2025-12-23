'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { CreateOrganizationForm } from '@/features/orgs/components/CreateOrganizationForm';
import { MyInvites } from '@/features/orgs/components/MyInvites';
import { Business as BusinessIcon, Email as EmailIcon } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import { useState } from 'react';

export default function OnboardingPage() {
  const [step, setStep] = useState<'choice' | 'create' | 'invites'>('choice');
  const { user, isSyncing } = useRNGAuth();

  // If already onboarded, send to dashboard
  if (!isSyncing && user?.onboarded) {
    redirect('/dashboard');
  }

  const renderChoice = () => (
    <Stack spacing={3}>
      <Box textAlign="center">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome, {user?.displayName}!
        </Typography>
        <Typography color="text.secondary">Onboarding Process?</Typography>
      </Box>

      <Card
        variant="outlined"
        sx={{
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
        onClick={() => setStep('invites')}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EmailIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Check Invitations</Typography>
            <Typography variant="body2" color="text.secondary">
              See if a team has already invited you.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{
          cursor: 'pointer',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
        onClick={() => setStep('create')}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">Create Organization</Typography>
            <Typography variant="body2" color="text.secondary">
              Start a fresh team and invite others.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );

  return (
    <Box>
      {step === 'choice' && renderChoice()}

      {step === 'invites' && (
        <Stack spacing={2}>
          <Button onClick={() => setStep('choice')} sx={{ alignSelf: 'flex-start' }}>
            Back
          </Button>
          <MyInvites />
        </Stack>
      )}

      {step === 'create' && (
        <Stack spacing={2}>
          <Button onClick={() => setStep('choice')} sx={{ alignSelf: 'flex-start' }}>
            Back
          </Button>
          <CreateOrganizationForm />
        </Stack>
      )}
    </Box>
  );
}

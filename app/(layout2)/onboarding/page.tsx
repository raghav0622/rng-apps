'use client';

import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import MailIcon from '@mui/icons-material/Mail';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 8,
        pb: 4,
      }}
    >
      <Box
        sx={{
          p: 4,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          maxWidth: 600,
          width: '100%',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome to RNG App
            </Typography>
            <Typography variant="body1" color="text.secondary">
              To get started, create a new organization or accept an invitation.
            </Typography>
          </Box>

          <Stack spacing={2} width="100%">
            <Button
              component={Link}
              href="/onboarding/create-org"
              variant="contained"
              size="large"
              startIcon={<AddBusinessIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Create New Organization
            </Button>

            <Divider>OR</Divider>

            <Button
              variant="outlined"
              size="large"
              startIcon={<MailIcon />}
              fullWidth
              disabled // We will implement invites in Step 5
              sx={{ py: 1.5 }}
            >
              Accept Invitation (Coming Soon)
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

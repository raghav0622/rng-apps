import { getUserPendingInvitesAction } from '@/core/organization/organization.actions';
import { PendingInvites } from '@/core/organization/components/PendingInvites';
import { SessionService } from '@/core/auth/session.service';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { Box, Button, Divider, Stack, Typography, Container } from '@mui/material';
import Link from 'next/link';

export default async function OnboardingPage() {
  const session = await SessionService.requireServerSession();
  
  // Fetch Pending Invites via Server Action
  const invitesRes = await getUserPendingInvitesAction();
  const invites = invitesRes?.data?.success ? invitesRes.data.data : [];

  return (
    <Container maxWidth="sm" sx={{ pt: 12 }}>
      <Box
        sx={{
          p: 6,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <Stack spacing={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Welcome to RNG App
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Let&apos;s get you set up. You can either create your own organization or join an existing one.
            </Typography>
          </Box>

          {/* --- Section 1: Pending Invitations --- */}
          {invites.length > 0 && (
            <Box>
              <PendingInvites invites={invites} />
              <Divider sx={{ my: 4 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>
            </Box>
          )}

          {/* --- Section 2: Create Org --- */}
          <Box sx={{ textAlign: 'center' }}>
            {invites.length === 0 && (
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Starting fresh?
              </Typography>
            )}
            <Button
              component={Link}
              href="/onboarding/create-org"
              variant="contained"
              size="large"
              startIcon={<AddBusinessIcon />}
              fullWidth
              sx={{ py: 2, borderRadius: 2, fontSize: '1.1rem' }}
            >
              Create New Organization
            </Button>
          </Box>

          {/* --- Help Text --- */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t see an invitation? Contact your administrator to invite you via your email: 
              <br />
              <strong>{session.email}</strong>
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}

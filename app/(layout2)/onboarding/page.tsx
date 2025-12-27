import { SessionService } from '@/core/auth/session.service';
import { PendingInvites } from '@/core/organization/components/PendingInvites';
import { getUserPendingInvitesAction } from '@/core/organization/organization.actions';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import { Box, Button, Divider, Typography } from '@mui/material';
import Link from 'next/link';

export default async function OnboardingLayout() {
  const session = await SessionService.requireServerSession();

  // Fetch Pending Invites via Server Action
  const invitesRes = await getUserPendingInvitesAction();
  const invites = invitesRes?.data?.success ? invitesRes.data.data : [];

  return (
    <>
      {invites.length > 0 ? (
        <PendingInvites invites={invites} />
      ) : (
        <Typography variant="body1" fontWeight="bold" textAlign="center">
          Maybe, wait for your Organziation to invite you!
        </Typography>
      )}

      <Divider>
        <Typography variant="caption" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* --- Section 2: Create Org --- */}
      <Box sx={{ textAlign: 'center' }}>
        {invites.length === 0 && (
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Starting fresh?
          </Typography>
        )}
        {/* 🛑 FIX: Do not pass Link as 'component' prop in Server Components. 
                Instead, wrap the Button in a Link. */}
        <Link href="/onboarding/create-org" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddBusinessIcon />}
            fullWidth
            sx={{ py: 2, borderRadius: 2, fontSize: '1.1rem' }}
          >
            Create New Organization
          </Button>
        </Link>
      </Box>
    </>
  );
}

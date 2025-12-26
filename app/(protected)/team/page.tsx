import { TeamList } from '@/core/organization/components/TeamList';
import { organizationService } from '@/core/organization/organization.service';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin'; // Or your session helper
import { Box, Container, Typography } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ClientTeamPageWrapper from './ClientTeamPage';

// Helper to get current user ID (adjust based on your auth implementation)
async function getSession() {
  const sessionCookie = (await cookies()).get(AUTH_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) redirect('/login');
  try {
    const decoded = await auth().verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch (e) {
    redirect('/login');
  }
}

export default async function TeamPage() {
  const session = await getSession();
  const userId = session.uid;

  // Fetch User to get OrgId
  const user = await import('@/core/auth/user.repository').then((m) =>
    m.userRepository.get(userId),
  );
  if (!user.orgId) redirect('/onboarding'); // Should be handled by middleware usually

  // Fetch Data Parallelly
  const [membersRes, invitesRes] = await Promise.all([
    organizationService.getMembers(user.orgId),
    organizationService.listPendingInvites(user.orgId),
  ]);

  const members = membersRes.data || [];
  const invites = invitesRes.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4">Team Management</Typography>
          <Typography color="text.secondary">
            Manage your organization members and permissions.
          </Typography>
        </Box>
        {/* We use a Client Component wrapper for the "Add Member" button state */}
        <ClientTeamPageWrapper>
          <TeamList members={members} invites={invites} currentUserId={userId} />
        </ClientTeamPageWrapper>
      </Box>
    </Container>
  );
}

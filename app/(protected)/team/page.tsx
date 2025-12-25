import { userRepository } from '@/core/auth/repositories/user.repository';
import { InviteMemberModal } from '@/core/org/components/InviteMemberModal';
import { TeamList } from '@/core/org/components/TeamList';
import { memberService } from '@/core/org/services/member.service';
import { AUTH_SESSION_COOKIE_NAME } from '@/lib/constants';
import { auth } from '@/lib/firebase/admin';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TeamPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) redirect('/login');

  // 1. Authenticate & Get Org Context
  let user;
  try {
    const decoded = await auth().verifySessionCookie(sessionCookie, true);
    user = await userRepository.get(decoded.uid);
  } catch (e) {
    redirect('/login');
  }

  if (!user || !user.orgId) redirect('/onboarding');

  // 2. Fetch Data
  const result = await memberService.getMembers(user.orgId);

  // 3. Handle Error State
  if (!result.success) {
    return <Alert severity="error">Failed to load team members: {result.error.message}</Alert>;
  }

  // 4. Unwrap Success Data
  const members = result.data;

  return (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Team Members
          </Typography>
          <Typography color="text.secondary">Manage your team and permissions.</Typography>
        </Box>
        <InviteMemberModal />
      </Stack>

      {/* Now strictly passing User[] */}
      <TeamList members={members} />
    </Stack>
  );
}

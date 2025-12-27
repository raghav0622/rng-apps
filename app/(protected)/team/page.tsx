import { SessionService } from '@/core/auth/session.service';
import { TeamList } from '@/core/organization/components/TeamList';
import {
  getMembersAction,
  listPendingInvitesAction,
} from '@/core/organization/organization.actions';
import { Invite, MemberWithProfile } from '@/core/organization/organization.model';
import { Box, Divider, Typography } from '@mui/material';
import ClientTeamPageWrapper from './ClientTeamPage';

export default async function TeamPage() {
  const session = await SessionService.requireServerSession();
  const userId = session.uid;

  const [membersRes, invitesRes] = await Promise.all([
    getMembersAction(),
    listPendingInvitesAction(),
  ]);

  if (membersRes?.serverError || invitesRes?.serverError) {
    console.error('[TeamPage] Server Error:', membersRes?.serverError || invitesRes?.serverError);
  }

  // Proper extraction with type safety
  const members: MemberWithProfile[] =
    membersRes?.data && 'success' in membersRes.data && membersRes.data.success
      ? membersRes.data.data
      : [];

  const invites: Invite[] =
    invitesRes?.data && 'success' in invitesRes.data && invitesRes.data.success
      ? invitesRes.data.data
      : [];

  return (
    <>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Team Management
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Manage your organization members, roles, and pending invitations.
          </Typography>
        </Box>
        <ClientTeamPageWrapper />
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box>
        <TeamList members={members} invites={invites} currentUserId={userId} />
      </Box>
    </>
  );
}

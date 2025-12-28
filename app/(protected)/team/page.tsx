import { SessionService } from '@/core/auth/session.service';
import { InviteMemberModal } from '@/core/organization/components/InviteMemberModal';
import { TeamList } from '@/core/organization/components/TeamList';
import {
  getMembersAction,
  listPendingInvitesAction,
} from '@/core/organization/organization.actions';
import { Invite, MemberWithProfile } from '@/core/organization/organization.model';
import { AppPermission, hasPermission } from '@/lib/action-policies';
import { Box, Container, Divider, Typography } from '@mui/material';

export default async function TeamPage() {
  // 🛡️ Centralized Session & Profile Retrieval
  const { user } = await SessionService.requireUserAndOrg({ strictOrg: true });
  const userRole = user.orgRole;

  // Calculate Permissions for UI rendering
  const canInvite = hasPermission(userRole, AppPermission.MEMBER_INVITE);
  const canUpdateRole = hasPermission(userRole, AppPermission.MEMBER_UPDATE);
  const canRemoveMember = hasPermission(userRole, AppPermission.MEMBER_REMOVE);
  const canViewInvites = hasPermission(userRole, AppPermission.MEMBER_VIEW);

  // --- Fetch Data ---
  const membersRes = await getMembersAction();
  
  let invitesRes: any = null;
  if (canViewInvites) {
    invitesRes = await listPendingInvitesAction();
  }

  // --- Extract Data Safely ---
  const members: MemberWithProfile[] =
    membersRes?.data && 'success' in membersRes.data && membersRes.data.success
      ? membersRes.data.data
      : [];

  const invites: Invite[] =
    invitesRes?.data && 'success' in invitesRes.data && invitesRes.data.success
      ? invitesRes.data.data
      : [];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Team Management
          </Typography>
          <Typography color="text.secondary" variant="body1">
            Manage your organization members, roles, and pending invitations.
          </Typography>
        </Box>

        {canInvite && <InviteMemberModal />}
      </Box>

      <Divider sx={{ mb: 4 }} />

      <Box>
        <TeamList
          members={members}
          invites={invites}
          currentUserId={user.id}
          currentUserRole={userRole}
          permissions={{
            canUpdateRole,
            canRemoveMember,
            canViewInvites,
          }}
        />
      </Box>
    </Container>
  );
}

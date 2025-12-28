'use client';

import { AppPermission, hasPermission, UserRoleInOrg } from '@/core/action-policies';
import { useRNGAuth } from '@/core/auth/auth.context';
import { InviteMemberModal } from '@/core/organization/components/InviteMemberModal';
import { TeamList } from '@/core/organization/components/TeamList';
import {
  getMembersAction,
  listPendingInvitesAction,
} from '@/core/organization/organization.actions';
import { Invite, MemberWithProfile } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { Box, Divider, Skeleton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function TeamPageContent() {
  const { user } = useRNGAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  const { runAction: fetchMembers, isExecuting: loadingMembers } = useRNGServerAction(
    getMembersAction,
    {
      onSuccess: (data: any) => setMembers(data),
    },
  );

  const { runAction: fetchInvites, isExecuting: loadingInvites } = useRNGServerAction(
    listPendingInvitesAction,
    {
      onSuccess: (data: any) => setInvites(data),
    },
  );

  useEffect(() => {
    if (user) {
      fetchMembers(undefined);
      if (hasPermission(user.orgRole as UserRoleInOrg, AppPermission.MEMBER_VIEW)) {
        fetchInvites(undefined);
      }
    }
  }, [user]);

  if (!user) return <Skeleton height={400} />;

  const userRole = user.orgRole as UserRoleInOrg;
  const canInvite = hasPermission(userRole, AppPermission.MEMBER_INVITE);
  const canUpdateRole = hasPermission(userRole, AppPermission.MEMBER_UPDATE);
  const canRemoveMember = hasPermission(userRole, AppPermission.MEMBER_REMOVE);
  const canViewInvites = hasPermission(userRole, AppPermission.MEMBER_VIEW);

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Team Management
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage your organization members, roles, and pending invitations.
          </Typography>
        </Box>

        {canInvite && <InviteMemberModal />}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {loadingMembers ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      ) : (
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
      )}
    </Box>
  );
}

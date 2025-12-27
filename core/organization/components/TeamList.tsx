'use client';

import {
  removeMemberAction,
  revokeInviteAction,
  updateMemberRoleAction,
} from '@/core/organization/organization.actions';
import { Invite, Member } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { UserRoleInOrg } from '@/lib/action-policies';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface TeamListProps {
  members: Member[];
  invites: Invite[];
  currentUserId: string;
}

export function TeamList({ members, invites, currentUserId }: TeamListProps) {
  const { runAction: updateRole } = useRNGServerAction(updateMemberRoleAction, {
    successMessage: 'Role updated successfully',
  });
  const { runAction: removeMember } = useRNGServerAction(removeMemberAction, {
    successMessage: 'Member removed',
  });
  const { runAction: revokeInvite } = useRNGServerAction(revokeInviteAction, {
    successMessage: 'Invite revoked',
  });

  return (
    <Box sx={{ mt: 4 }}>
      {/* --- Active Members Section --- */}
      <Typography variant="h6" gutterBottom>
        Active Members
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={member.photoURL} alt={member.displayName}>
                      {member.displayName?.charAt(0) || member.email.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {member.displayName || 'Unknown'}
                        {member.userId === currentUserId && ' (You)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={member.role}
                    disabled={
                      member.userId === currentUserId || member.role === UserRoleInOrg.OWNER
                    }
                    onChange={(e) =>
                      updateRole({
                        userId: member.userId,
                        role: e.target.value as UserRoleInOrg,
                      })
                    }
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value={UserRoleInOrg.ADMIN}>Admin</MenuItem>
                    <MenuItem value={UserRoleInOrg.MEMBER}>Member</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="error"
                    disabled={
                      member.userId === currentUserId || member.role === UserRoleInOrg.OWNER
                    }
                    onClick={() => {
                      if (confirm('Are you sure you want to remove this member?')) {
                        removeMember({ userId: member.userId });
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Pending Invites Section --- */}
      {invites.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Pending Invitations
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Chip label={invite.role} size="small" />
                    </TableCell>
                    <TableCell>{new Date(invite.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => revokeInvite({ inviteId: invite.id })}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

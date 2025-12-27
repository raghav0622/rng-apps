'use client';

import {
  removeMemberAction,
  revokeInviteAction,
  updateMemberRoleAction,
} from '@/core/organization/organization.actions';
import { Invite, MemberWithProfile } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { UserRoleInOrg } from '@/lib/action-policies';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  MenuItem,
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
  members: MemberWithProfile[];
  invites: Invite[];
  currentUserId: string;
  permissions: {
    canUpdateRole: boolean;
    canRemoveMember: boolean;
    canViewInvites: boolean;
  };
}

export function TeamList({ members, invites, currentUserId, permissions }: TeamListProps) {
  const { runAction: updateRole } = useRNGServerAction(updateMemberRoleAction, {
    successMessage: 'Role updated successfully',
  });
  const { runAction: removeMember } = useRNGServerAction(removeMemberAction, {
    successMessage: 'Member removed',
  });
  const { runAction: revokeInvite } = useRNGServerAction(revokeInviteAction, {
    successMessage: 'Invite revoked',
  });

  const showActionsColumn = permissions.canUpdateRole || permissions.canRemoveMember;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* --- Active Members Section --- */}
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Active Members ({members.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                {showActionsColumn && (
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={member.user?.photoURL} 
                        alt={member.user?.displayName}
                        sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
                      >
                        {member.user?.displayName?.charAt(0) || member.user?.email.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {member.user?.displayName || 'Unknown User'}
                          {member.userId === currentUserId && (
                            <Chip label="You" size="small" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} color="primary" variant="outlined" />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={member.role}
                      disabled={
                        !permissions.canUpdateRole ||
                        member.userId === currentUserId || 
                        member.role === UserRoleInOrg.OWNER
                      }
                      onChange={(e) =>
                        updateRole({
                          userId: member.userId,
                          role: e.target.value as UserRoleInOrg,
                        })
                      }
                      sx={{ 
                        minWidth: 120, 
                        fontSize: '0.875rem',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { border: permissions.canUpdateRole ? '1px solid' : 'none', borderColor: 'divider' },
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }}
                    >
                      <MenuItem value={UserRoleInOrg.OWNER} disabled>Owner</MenuItem>
                      <MenuItem value={UserRoleInOrg.ADMIN}>Admin</MenuItem>
                      <MenuItem value={UserRoleInOrg.MEMBER}>Member</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  {showActionsColumn && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        disabled={
                          !permissions.canRemoveMember ||
                          member.userId === currentUserId || 
                          member.role === UserRoleInOrg.OWNER
                        }
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this member?')) {
                            removeMember({ userId: member.userId });
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* --- Pending Invites Section --- */}
      {permissions.canViewInvites && invites.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
           <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Pending Invitations ({invites.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sent At</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{invite.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invite.role} 
                        size="small" 
                        variant="outlined" 
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        disabled={!permissions.canRemoveMember} // Revoking is akin to removing
                        onClick={() => revokeInvite({ inviteId: invite.id })}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}

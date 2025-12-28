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
import EditIcon from '@mui/icons-material/Edit';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface TeamListProps {
  members: MemberWithProfile[];
  invites: Invite[];
  currentUserId: string;
  currentUserRole: UserRoleInOrg;
  permissions: {
    canUpdateRole: boolean;
    canRemoveMember: boolean;
    canViewInvites: boolean;
  };
}

const ROLE_PRIORITY: Record<UserRoleInOrg, number> = {
  [UserRoleInOrg.OWNER]: 0,
  [UserRoleInOrg.ADMIN]: 1,
  [UserRoleInOrg.MEMBER]: 2,
  [UserRoleInOrg.NOT_IN_ORG]: 3,
};

export function TeamList({ members, invites, currentUserId, currentUserRole, permissions }: TeamListProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  const { runAction: updateRole } = useRNGServerAction(updateMemberRoleAction, {
    successMessage: 'Role updated successfully',
  });
  const { runAction: removeMember } = useRNGServerAction(removeMemberAction, {
    successMessage: 'Member removed',
  });
  const { runAction: revokeInvite } = useRNGServerAction(revokeInviteAction, {
    successMessage: 'Invite revoked',
  });

  const handleEditClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setActiveMemberId(userId);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveMemberId(null);
  };

  const handleRoleSelect = (newRole: UserRoleInOrg) => {
    if (activeMemberId) {
      updateRole({ userId: activeMemberId, role: newRole });
    }
    handleClose();
  };

  /**
   * Hierarchical Rule: 
   * 1. Owners can modify anyone (except themselves).
   * 2. Admins can ONLY modify Members.
   * 3. Members cannot modify anyone.
   */
  const canModifyMember = (targetMember: MemberWithProfile) => {
    if (targetMember.userId === currentUserId) return false;
    if (currentUserRole === UserRoleInOrg.OWNER) return true;
    if (currentUserRole === UserRoleInOrg.ADMIN) {
      return targetMember.role === UserRoleInOrg.MEMBER;
    }
    return false;
  };

  const sortedMembers = [...members].sort((a, b) => {
    return ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
  });

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
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMembers.map((member) => {
                const isModifiable = canModifyMember(member);
                
                return (
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
                      <Chip 
                        label={member.role} 
                        size="small" 
                        variant="tonal" 
                        color={member.role === UserRoleInOrg.OWNER ? 'primary' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {isModifiable && permissions.canUpdateRole && (
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditClick(e, member.userId)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {isModifiable && permissions.canRemoveMember && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this member?')) {
                                removeMember({ userId: member.userId });
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Role Update Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleRoleSelect(UserRoleInOrg.ADMIN)}>Admin</MenuItem>
        <MenuItem onClick={() => handleRoleSelect(UserRoleInOrg.MEMBER)}>Member</MenuItem>
      </Menu>

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
                      {permissions.canRemoveMember && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => revokeInvite({ inviteId: invite.id })}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Revoke
                        </Button>
                      )}
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

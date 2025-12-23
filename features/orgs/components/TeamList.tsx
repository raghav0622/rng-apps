'use client';

import { User } from '@/features/auth/auth.model';
import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { UserRoleInOrg } from '@/features/enums';
import {
  getMembersAction,
  removeMemberAction,
  updateMemberRoleAction,
} from '@/features/orgs/actions/member.actions';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { AlertBanner } from '@/ui/feedback/AlertBanner';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

export function TeamList() {
  const { user } = useRNGAuth();
  const [members, setMembers] = useState<User[]>([]);

  // Actions
  const {
    runAction: fetchMembers,
    status: fetchStatus,
    result: fetchResult,
    //@ts-expect-error yolo
  } = useRNGServerAction(getMembersAction);
  const { runAction: removeMember } = useRNGServerAction(removeMemberAction);
  const { runAction: updateRole } = useRNGServerAction(updateMemberRoleAction);

  // Menu State for Role Management
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  // FIX: Unwrap the 'Result<T>' object
  useEffect(() => {
    if (fetchResult?.data && fetchResult.data.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMembers(fetchResult.data.data);
    }
  }, [fetchResult]);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, target: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(target);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleRoleChange = async (newRole: UserRoleInOrg) => {
    if (!selectedUser) return;
    await updateRole({ userId: selectedUser.uid, newRole });
    handleCloseMenu();
    fetchMembers(); // Refresh list
  };

  const handleRemove = async (targetId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember({ userId: targetId });
      fetchMembers();
    }
  };

  if (fetchStatus === 'executing' && members.length === 0) return <LoadingSpinner />;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Team Members
        </Typography>

        {members.length === 0 && fetchStatus !== 'executing' && (
          <AlertBanner severity="info">No members found.</AlertBanner>
        )}

        <List>
          {members.map((member) => (
            <ListItem key={member.uid} divider>
              <ListItemAvatar>
                <Avatar src={member.photoUrl || undefined}>
                  {member.displayName?.[0] || member.email?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {member.displayName || 'Unknown User'}
                    {member.uid === user?.uid && (
                      <Chip label="You" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" display="flex" flexDirection="column">
                    <Typography variant="body2" component="span">
                      {member.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="span">
                      Role: <strong>{member.orgRole}</strong>
                    </Typography>
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                {/* Only Owners/Admins can manage others, and you can't manage yourself here */}
                {user?.orgRole !== UserRoleInOrg.MEMBER && member.uid !== user?.uid && (
                  <>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleOpenMenu(e, member)}
                      aria-label="manage settings"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem disabled>Manage {selectedUser?.displayName}</MenuItem>
          <MenuItem onClick={() => handleRoleChange(UserRoleInOrg.ADMIN)}>
            <SecurityIcon fontSize="small" style={{ marginRight: 8 }} /> Promote to Admin
          </MenuItem>
          <MenuItem onClick={() => handleRoleChange(UserRoleInOrg.MEMBER)}>
            <PersonIcon fontSize="small" style={{ marginRight: 8 }} /> Demote to Member
          </MenuItem>
          <MenuItem
            onClick={() => selectedUser && handleRemove(selectedUser.uid)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" style={{ marginRight: 8 }} /> Remove from Team
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

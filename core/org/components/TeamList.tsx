'use client';

import { useRNGAuth } from '@/core/auth/auth.context';
import { User } from '@/core/auth/auth.model';
import { removeMemberAction, updateMemberRoleAction } from '@/core/org/actions/member.actions';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { UserRoleInOrg } from '@/lib/action-policies';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export function TeamList({ members }: { members: User[] }) {
  const { user: currentUser } = useRNGAuth();

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Member</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <MemberRow key={member.id} member={member} isMe={currentUser?.id === member.id} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MemberRow({ member, isMe }: { member: User; isMe: boolean }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { runAction: removeMember } = useRNGServerAction(removeMemberAction);
  const { runAction: updateRole } = useRNGServerAction(updateMemberRoleAction);

  const handleAction = (action: () => void) => {
    setAnchorEl(null);
    action();
  };

  return (
    <TableRow>
      <TableCell>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={member.photoURL || undefined} alt={member.displayName}>
            {member.displayName?.[0]}
          </Avatar>
          <div>
            <Typography variant="subtitle2">
              {member.displayName} {isMe && '(You)'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {member.email}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Chip
          label={member.orgRole}
          size="small"
          color={member.orgRole === 'OWNER' ? 'primary' : 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Chip label="Active" size="small" color="success" sx={{ height: 20, fontSize: 10 }} />
      </TableCell>
      <TableCell align="right">
        {!isMe && member.orgRole !== 'OWNER' && (
          <>
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem
                onClick={() =>
                  handleAction(() => updateRole({ userId: member.id, role: UserRoleInOrg.ADMIN }))
                }
              >
                Promote to Admin
              </MenuItem>
              <MenuItem
                onClick={() =>
                  handleAction(() => updateRole({ userId: member.id, role: UserRoleInOrg.MEMBER }))
                }
              >
                Demote to Member
              </MenuItem>
              <MenuItem
                onClick={() => handleAction(() => removeMember({ userId: member.id }))}
                sx={{ color: 'error.main' }}
              >
                Remove from Team
              </MenuItem>
            </Menu>
          </>
        )}
      </TableCell>
    </TableRow>
  );
}

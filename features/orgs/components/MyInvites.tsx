'use client';

import { useRNGAuth as useAuth } from '@/features/auth/components/AuthContext';
import { getMyInvitesAction, respondToInviteAction } from '@/features/orgs/actions/invite.actions';
import { OrgInvite } from '@/features/orgs/invite.model';
import { useRNGServerAction as useRngAction } from '@/lib/use-rng-action';
import { AlertBanner } from '@/ui/feedback/AlertBanner';
import { LoadingSpinner } from '@/ui/LoadingSpinner';
import { Check as CheckIcon, Close as CloseIcon, Email as EmailIcon } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';

export function MyInvites() {
  const { user } = useAuth();
  const theme = useTheme();
  const [invites, setInvites] = useState<OrgInvite[]>([]);

  // Fetch Invites
  const { execute: fetchInvites, status: fetchStatus, result } = useRngAction(getMyInvitesAction);

  // Respond Action
  const { execute: respond, status: respondStatus } = useRngAction(respondToInviteAction, {
    onSuccess: () => {
      fetchInvites(); // Refresh list after action
    },
  });

  useEffect(() => {
    fetchInvites();
  }, []);

  // FIX: Unwrap the 'Result<T>' object correctly
  useEffect(() => {
    if (result?.data && result.data.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvites(result.data.data);
    }
  }, [result]);

  const handleRespond = (inviteId: string, accept: boolean) => {
    if (accept && user?.orgId) {
      if (
        !confirm('Accepting this invite will remove you from your current organization. Continue?')
      ) {
        return;
      }
    }
    respond({ inviteId, accept });
  };

  // Loading state (initial only)
  if (fetchStatus === 'executing' && invites.length === 0) return <LoadingSpinner />;

  // If no invites, render nothing (cleaner UI)
  if (invites.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ mb: 4, borderColor: theme.palette.primary.main }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <EmailIcon color="primary" />
          <Typography variant="h6">Pending Invitations</Typography>
        </Box>

        <AlertBanner>
          You have been invited to join an organization. Accepting will make you a member.
        </AlertBanner>

        <List>
          {invites.map((invite) => (
            <ListItem
              key={invite.id}
              divider
              sx={{
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                  {invite.orgName?.[0]?.toUpperCase() || 'O'}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="bold">
                    {invite.orgName}
                  </Typography>
                }
                secondary={
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Typography variant="body2">
                      Role: <strong>{invite.role}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Invited {new Date(invite.createdAt as any).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />

              <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => handleRespond(invite.id, false)}
                  disabled={respondStatus === 'executing'}
                  fullWidth
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={() => handleRespond(invite.id, true)}
                  disabled={respondStatus === 'executing'}
                  fullWidth
                >
                  Accept
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

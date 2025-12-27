'use client';

import {
  acceptInviteAction,
  rejectInviteAction,
} from '@/core/organization/organization.actions';
import { InviteWithOrg } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface PendingInvitesProps {
  invites: InviteWithOrg[];
}

export function PendingInvites({ invites }: PendingInvitesProps) {
  const { runAction: accept, isExecuting: isAccepting } = useRNGServerAction(acceptInviteAction, {
    successMessage: 'Invite accepted! Redirecting...',
    onSuccess: () => {
      // Hard redirect to clear state and refresh session
      window.location.href = '/dashboard';
    },
  });

  const { runAction: reject, isExecuting: isRejecting } = useRNGServerAction(rejectInviteAction, {
    successMessage: 'Invite declined',
    onSuccess: () => {
       window.location.reload();
    }
  });

  if (invites.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Pending Invitations
      </Typography>
      <Stack spacing={2}>
        {invites.map((invite) => (
          <Card key={invite.id} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: '16px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <BusinessIcon color="primary" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {invite.organizationName || 'New Organization'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You have been invited to join as a <strong>{invite.role}</strong>.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CheckIcon />}
                    disabled={isAccepting || isRejecting}
                    onClick={() => accept({ token: invite.token })}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    disabled={isAccepting || isRejecting}
                    onClick={() => {
                      if (confirm('Are you sure you want to decline this invitation?')) {
                        reject({ token: invite.token });
                      }
                    }}
                  >
                    Decline
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}

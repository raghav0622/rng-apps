'use client';

import {
  acceptOwnershipAction,
  offerOwnershipAction,
  rejectOwnershipAction,
  revokeOwnershipAction,
} from '@/core/organization/organization.actions';
import { MemberWithProfile, OfferOwnershipSchema, Organization } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/rng-ui/AppModal';
import { Button, Card, CardContent, Typography, Box, Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';

interface TransferOwnershipProps {
  org: Organization;
  members: MemberWithProfile[];
  currentUserId: string;
}

export function TransferOwnership({ org, members, currentUserId }: TransferOwnershipProps) {
  const isOwner = org.ownerId === currentUserId;
  const isPendingOwner = org.pendingOwnerId === currentUserId;

  const { runAction: offerOwnership, isExecuting: isOffering } = useRNGServerAction(
    offerOwnershipAction,
    {
      successMessage: 'Ownership offered successfully',
    },
  );

  const { runAction: revokeOwnership, isExecuting: isRevoking } = useRNGServerAction(
    revokeOwnershipAction,
    {
      successMessage: 'Ownership offer cancelled',
    }
  );

  const { runAction: acceptOwnership, isExecuting: isAccepting } = useRNGServerAction(
    acceptOwnershipAction,
    {
      successMessage: 'Ownership accepted! You are now the Owner.',
    },
  );

  const { runAction: rejectOwnership, isExecuting: isRejecting } = useRNGServerAction(
    rejectOwnershipAction,
    {
      successMessage: 'Ownership offer declined',
    }
  );

  // Filter eligible members (Must be Admin, not current owner)
  const eligibleMembers = members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => ({ 
       label: m.user?.displayName || m.user?.email || 'Unknown User', 
       value: m.userId 
    }));

  const pendingMember = members.find(m => m.userId === org.pendingOwnerId);
  const pendingDisplayName = pendingMember?.user?.displayName || pendingMember?.user?.email || 'the target user';

  const formConfig = defineForm<typeof OfferOwnershipSchema>((f) => [
    f.autocomplete('targetUserId', eligibleMembers, {
      label: 'Select New Owner',
      description: 'The selected member must accept the invitation to become the new owner.',
      getOptionLabel: (opt: any) => opt.label,
      getOptionValue: (opt: any) => opt.value,
    }),
  ]);

  if (isPendingOwner) {
    return (
      <Card variant="outlined" sx={{ bgcolor: 'primary.lighter', borderColor: 'primary.main', mb: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <InfoIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Ownership Transfer Offer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You have been invited to become the Owner of this organization. This will give you full administrative control.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  if (confirm('Are you sure you want to decline this offer?')) {
                    rejectOwnership({});
                  }
                }}
                disabled={isRejecting || isAccepting}
              >
                Decline
              </Button>
              <Button
                color="primary"
                variant="contained"
                size="small"
                onClick={() => acceptOwnership({})}
                disabled={isAccepting || isRejecting}
              >
                {isAccepting ? 'Accepting...' : 'Accept Ownership'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) return null;

  return (
    <Card variant="outlined" sx={{ borderColor: 'error.main', mb: 4 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'error.main', bgcolor: 'error.lighter' }}>
        <Typography variant="subtitle1" fontWeight={600} color="error.dark">
          Danger Zone: Transfer Ownership
        </Typography>
      </Box>
      <CardContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Transferring ownership is irreversible. Once accepted, you will be demoted to an <strong>Admin</strong> role and the target user will have full control over the organization, including billing and member management.
        </Typography>

        {org.pendingOwnerId ? (
          <Box sx={{ p: 2, bgcolor: 'warning.lighter', border: '1px dashed', borderColor: 'warning.main', borderRadius: 1 }}>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={2} alignItems="center">
                <WarningAmberIcon color="warning" />
                <Typography variant="body2" fontWeight={500}>
                  Pending Transfer: Waiting for <strong>{pendingDisplayName}</strong> to accept the ownership offer.
                </Typography>
              </Stack>
              <Button 
                variant="text" 
                color="error" 
                size="small" 
                startIcon={<CancelIcon />}
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this transfer?')) {
                    revokeOwnership({});
                  }
                }}
                disabled={isRevoking}
              >
                Cancel Transfer
              </Button>
            </Stack>
          </Box>
        ) : (
          <AppModal
            title="Transfer Ownership"
            trigger={
              <Button variant="outlined" color="error">
                Transfer Ownership
              </Button>
            }
          >
            {({ setOpen }) => (
              <Box sx={{ p: 1 }}>
                <RNGForm
                  schema={OfferOwnershipSchema}
                  uiSchema={formConfig}
                  submitLabel={isOffering ? 'Sending Offer...' : 'Send Offer'}
                  onSubmit={async (data) => {
                    const res = await offerOwnership(data);
                    if (res !== undefined) setOpen(false);
                  }}
                />
              </Box>
            )}
          </AppModal>
        )}
      </CardContent>
    </Card>
  );
}

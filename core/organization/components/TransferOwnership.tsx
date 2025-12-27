'use client';

import {
  acceptOwnershipAction,
  offerOwnershipAction,
} from '@/core/organization/organization.actions';
import { Member, OfferOwnershipSchema, Organization } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AlertBanner } from '@/ui/feedback/AlertBanner';
import { AppModal } from '@/ui/modals/AppModal';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';

interface TransferOwnershipProps {
  org: Organization;
  members: Member[];
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

  const { runAction: acceptOwnership, isExecuting: isAccepting } = useRNGServerAction(
    acceptOwnershipAction,
    {
      successMessage: 'Ownership accepted! You are now the Owner.',
    },
  );

  // Filter eligible members (Must be Admin, not current owner)
  // In a real app, you'd check role === 'ADMIN'. Here we just exclude self.
  const eligibleMembers = members
    .filter((m) => m.userId !== currentUserId)
    .map((m) => ({ label: m.email, value: m.userId }));

  const formConfig = defineForm<typeof OfferOwnershipSchema>((f) => [
    f.autocomplete('targetUserId', eligibleMembers, {
      label: 'Select New Owner',
      description: 'The selected member must accept the invitation to become the new owner.',
    }),
  ]);

  if (isPendingOwner) {
    return (
      <AlertBanner
        type="info"
        title="Ownership Offer"
        message="You have been offered ownership of this organization."
        action={
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={() => acceptOwnership({})}
            disabled={isAccepting}
          >
            Accept Ownership
          </Button>
        }
      />
    );
  }

  if (!isOwner) return null;

  return (
    <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
      <CardContent>
        <Typography variant="h6" color="error" gutterBottom>
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Transferring ownership is irreversible. You will be demoted to an Admin.
        </Typography>

        {org.pendingOwnerId ? (
          <AlertBanner
            type="warning"
            title="Pending Transfer"
            message={`Waiting for response from user (ID: ${org.pendingOwnerId})`}
          />
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
              <RNGForm
                schema={OfferOwnershipSchema}
                uiSchema={formConfig}
                submitLabel={isOffering ? 'Sending Offer...' : 'Send Offer'}
                onSubmit={async (data) => {
                  const res = await offerOwnership(data);
                  if (res !== undefined) setOpen(false);
                }}
              />
            )}
          </AppModal>
        )}
      </CardContent>
    </Card>
  );
}

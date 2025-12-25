'use client';

import { sendInviteAction } from '@/core/invites/invite.actions';
import { SendInviteSchema } from '@/core/invites/invite.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { UserRoleInOrg } from '@/lib/action-policies';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/ui/modals/AppModal';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
const formConfig = defineForm<typeof SendInviteSchema>((f) => [
  f.text('email', { label: 'Email Address', placeholder: 'colleague@example.com' }),
  f.autocomplete('role', ['MEMBER', 'ADMIN'], {
    label: 'Role',
  }),
]);

export function InviteMemberModal() {
  const { runAction } = useRNGServerAction(sendInviteAction, {
    successMessage: 'Invite sent successfully!',
  });

  return (
    <>
      <AppModal
        title="Invite New Member"
        trigger={
          <Button variant="contained" startIcon={<AddIcon />}>
            Invite Member
          </Button>
        }
        // ="Send an email invitation to join your organization."
      >
        {({ setOpen }) => (
          <>
            <RNGForm
              schema={SendInviteSchema}
              uiSchema={formConfig}
              defaultValues={{ role: UserRoleInOrg.MEMBER }}
              onSubmit={async (data) => {
                await runAction(data);
              }}
              submitLabel="Send Invite"
            />
          </>
        )}
      </AppModal>
    </>
  );
}

'use client';

import { sendInviteAction } from '@/core/organization/organization.actions'; // Ensure absolute path
import { SendInviteSchema } from '@/core/organization/organization.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action'; // Updated import based on typical naming
import { UserRoleInOrg } from '@/lib/action-policies';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/ui/AppModal';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';

// Use the Enum directly for options to ensure Zod validation passes on server
const ROLE_OPTIONS = Object.values(UserRoleInOrg).map((role) => ({
  label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(), // "Member", "Admin"
  value: role,
}));

const formConfig = defineForm<typeof SendInviteSchema>((f) => [
  f.text('email', {
    label: 'Email Address',
    placeholder: 'colleague@example.com',
    autoFocus: true,
  }),
  // Use 'select' or 'autocomplete' depending on your UI preference
  f.autocomplete('role', ROLE_OPTIONS, {
    label: 'Role',
  }),
]);

export function InviteMemberModal() {
  const { runAction: execute, isExecuting } = useRNGServerAction(sendInviteAction, {
    successMessage: 'Invite Sent Successfully',
    errorMessage: 'Failed to send invite',
  });

  return (
    <AppModal
      title="Invite New Member"
      trigger={
        <Button variant="contained" startIcon={<AddIcon />}>
          Invite Member
        </Button>
      }
    >
      {({ setOpen }) => (
        <RNGForm
          schema={SendInviteSchema}
          uiSchema={formConfig}
          defaultValues={{ role: UserRoleInOrg.MEMBER }}
          submitLabel={isExecuting ? 'Sending...' : 'Send Invite'}
          // Disable submit while action is executing
          readOnly={isExecuting}
          onSubmit={async (data) => {
            const result = await execute(data);
            if (result) {
              setOpen(false); // ✅ Close modal on success
            }
          }}
        />
      )}
    </AppModal>
  );
}

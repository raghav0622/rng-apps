'use client';

import { UserRoleInOrg } from '@/features/enums';
import { createInviteAction } from '@/features/orgs/actions/invite.actions';
import { CreateInviteSchema } from '@/features/orgs/invite.model';
import { useRNGServerAction as useRngAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Card, CardContent } from '@mui/material';

// Define the UI Structure using your DSL
const inviteUiSchema = defineForm<typeof CreateInviteSchema>((f) => [
  f.text('email', {
    label: 'Email Address',
    placeholder: 'colleague@company.com',
    description: 'We will send an invitation link to this address.',
  }),
  f.autocomplete(
    'role',
    [
      { label: 'Admin (Full Access)', value: UserRoleInOrg.ADMIN },
      { label: 'Member (Limited Access)', value: UserRoleInOrg.MEMBER },
    ],
    {
      label: 'Role',
      description: 'Admins can manage the team and billing.',
    },
  ),
]);

export function InviteForm() {
  const { runAction: execute, status } = useRngAction(createInviteAction, {
    onSuccess: () => {
      alert('Invite sent successfully!');
      // Note: RNGForm can handle reset internally if configured,
      // or we can use a key to force re-render if needed to clear strict states.
    },
  });

  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <RNGForm
          title="Invite New Member"
          description="Enter the email address of the person you want to invite."
          schema={CreateInviteSchema}
          uiSchema={inviteUiSchema}
          defaultValues={{
            email: '',
            role: UserRoleInOrg.MEMBER,
          }}
          onSubmit={async (data) => {
            await execute(data);
          }}
          submitLabel="Send Invitation"
          submitingLablel="Sending..."
          requireChanges={true} // UX: Prevent accidental double-sends of empty forms
        />
      </CardContent>
    </Card>
  );
}

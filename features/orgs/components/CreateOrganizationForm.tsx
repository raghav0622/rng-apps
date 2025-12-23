'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { createOrganizationAction } from '@/features/orgs/actions/org.actions';
import { CreateOrganizationSchema } from '@/features/orgs/org.model';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';

const createOrgUiSchema = defineForm<typeof CreateOrganizationSchema>((f) => [
  f.text('name', {
    label: 'Organization Name',
    description: 'This will be the public name of your team.',
    placeholder: 'e.g. Acme Corp',
  }),
]);

export function CreateOrganizationForm() {
  const { refreshSession } = useRNGAuth(); // <--- Hook to refresh session
  const router = useRouter();
  const { execute, status } = useRNGServerAction(createOrganizationAction, {
    onSuccess: async () => {
      // 1. Force a session refresh to update 'user.orgId' and 'user.onboarded' in context
      await refreshSession();
      // 2. The Dashboard page will detect the change and re-render
    },
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <RNGForm
          title="Create a New Organization"
          description="You are not currently a member of any organization. Create one to get started."
          schema={CreateOrganizationSchema}
          uiSchema={createOrgUiSchema}
          defaultValues={{ name: '' }}
          onSubmit={async (data) => {
            await execute(data);
            router.push('/');
          }}
          submitLabel="Create Organization"
          submitingLablel="Creating..."
        />
      </CardContent>
    </Card>
  );
}

'use client';

import { createEntityAction } from '@/app-features/entities/entity.actions';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGPage } from '@/ui/layouts/RNGPage';
import { useRouter } from 'next/navigation';
import { EntityForm } from '../_components/EntityForm';

export default function CreateEntityPage() {
  const router = useRouter();
  const { execute, isExecuting } = useRngAction(createEntityAction, {
    successMessage: 'Entity registered successfully',
    onSuccess: () => router.push('/entities'), // Redirect to dashboard
  });

  return (
    <RNGPage
      title="Register New Entity"
      description="Create a new Client, Vendor, Contractor, or Consultant."
      breadcrumbs={[
        { label: 'Entities', href: '/entities' },
        { label: 'Create', href: '/entities/create' },
      ]}
    >
      <EntityForm
        onSubmit={async (data) => {
          await execute(data);
        }}
        isLoading={isExecuting}
      />
    </RNGPage>
  );
}

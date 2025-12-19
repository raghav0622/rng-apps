'use client';

import { updateOrganizationAction } from '@/features/org/org.actions';
import { Organization, UpdateOrgSchema } from '@/features/org/org.model';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { useAction } from 'next-safe-action/hooks';
import { useSnackbar } from 'notistack';

export function OrganizationSettingsForm({ org }: { org: Organization }) {
  const { enqueueSnackbar } = useSnackbar();
  const { executeAsync, isExecuting } = useAction(updateOrganizationAction);

  const handleSubmit = async (data: any) => {
    try {
      await executeAsync({
        orgId: org.id,
        name: data.name,
      });

      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
    } catch (error: any) {
      throw new FormError(error.message);
    }
  };

  return (
    <RNGForm
      schema={UpdateOrgSchema}
      defaultValues={{
        orgId: org.id,
        name: org.name,
      }}
      onSubmit={handleSubmit}
      submitLabel={isExecuting ? 'Saving...' : 'Save Changes'}
      uiSchema={[
        {
          name: 'name',
          type: 'text',
          label: 'Organization Name',
        },
        {
          name: 'orgId',
          type: 'hidden',
        },
      ]}
    />
  );
}

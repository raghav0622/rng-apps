'use client';

import { createOrganizationAction } from '@/features/org/org.actions';
import { CreateOrgSchema } from '@/features/org/org.model';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Typography } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

export default function OnboardingPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { executeAsync, isExecuting } = useAction(createOrganizationAction);

  const handleSubmit = async (data: { name: string }) => {
    try {
      await executeAsync(data);
      enqueueSnackbar('Organization created!', { variant: 'success' });
      window.location.href = '/dashboard';
    } catch (error: any) {
      throw new FormError(error.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome!
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        To get started, please create your organization.
      </Typography>

      <RNGForm
        schema={CreateOrgSchema}
        defaultValues={{ name: '' }}
        onSubmit={handleSubmit}
        submitLabel={isExecuting ? 'Creating...' : 'Create Organization'}
        uiSchema={[
          {
            name: 'name',
            type: 'text',
            label: 'Organization Name',
            placeholder: 'e.g. Acme Corp',
          },
        ]}
      />
    </Box>
  );
}

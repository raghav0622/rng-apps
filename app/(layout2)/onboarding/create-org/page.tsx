'use client';

import { createOrganizationAction } from '@/core/org/org.actions';
import { CreateOrgSchema } from '@/core/org/org.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const formConfig = defineForm<typeof CreateOrgSchema>((f) => [
  f.text('name', {
    label: 'Organization Name',
    placeholder: 'Acme Corp',
    description: 'This will be the display name of your workspace.',
  }),
]);

export default function CreateOrgPage() {
  const router = useRouter();
  const { runAction, isExecuting } = useRNGServerAction(createOrganizationAction, {
    successMessage: 'Organization created successfully!',
    onSuccess: () => {
      // Hard refresh to update Layout state (which checks user.orgId)
      window.location.href = '/dashboard';
    },
  });

  return (
    <Box>
      <Button
        component={Link}
        href="/onboarding"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, ml: -1 }}
      >
        Back
      </Button>

      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Name your Organization
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        This creates a new workspace where you are the Owner.
      </Typography>

      <RNGForm
        schema={CreateOrgSchema}
        uiSchema={formConfig}
        onSubmit={async (data) => {
          await runAction(data);
        }}
        submitLabel="Create Organization"
      />
    </Box>
  );
}

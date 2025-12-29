'use client';

import { EntityFormSchema, entityFormUI } from '@/app-features/entities/entity.form';
import { Entity, EntityInput } from '@/app-features/entities/entity.model';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { Box, Paper, Typography } from '@mui/material';

interface EntityFormProps {
  defaultValues?: Partial<Entity>;
  onSubmit: (data: EntityInput) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function EntityForm({ defaultValues, onSubmit, isLoading, isEdit }: EntityFormProps) {
  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          {isEdit ? 'Edit Entity Details' : 'Registration Form'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isEdit
            ? 'Update the entity information below.'
            : 'Fill in the complete details to register a new entity.'}
        </Typography>
      </Box>

      <RNGForm
        schema={EntityFormSchema}
        uiSchema={entityFormUI}
        defaultValues={defaultValues || {}}
        onSubmit={async (data) => {
          await onSubmit(data as EntityInput);
        }}
        submitLabel={isEdit ? 'Save Changes' : 'Create Entity'}
      />
    </Paper>
  );
}

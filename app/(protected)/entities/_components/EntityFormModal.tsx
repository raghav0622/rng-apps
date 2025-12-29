'use client';

import { createEntityAction } from '@/app-features/entities/entity.actions';
import { EntitySchema, EntityType } from '@/app-features/entities/entity.model';
import { useRngAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/ui/AppModal';
import { RNGButton } from '@/ui/components/RNGButton';
import { Add } from '@mui/icons-material';

// 1. Strict Schema Definition
const CreateEntitySchema = EntitySchema.pick({
  name: true,
  type: true,
  email: true,
  phone: true,
  address: true,
  tags: true,
  details: true,
});

// 2. DSL Definition
const entityFormUI = defineForm<typeof CreateEntitySchema>((t) => [
  t.section('Basic Info', [
    // ✅ 'required' is now valid because we added it to BaseFormItem
    t.text('name', { label: 'Entity Name', required: true, placeholder: 'Acme Corp' }),

    // ✅ FIXED SIGNATURE: t.select(name, options, props)
    t.select(
      'type',
      [
        { label: 'Client', value: EntityType.CLIENT },
        { label: 'Vendor', value: EntityType.VENDOR },
        { label: 'Contractor', value: EntityType.CONTRACTOR },
        { label: 'Consultant', value: EntityType.CONSULTANT },
      ],
      {
        label: 'Type',
        required: true,
        getOptionLabel: (option) => option.label,
        getOptionValue: (option) => option.value,
        isOptionEqualToValue: (option, value) => option.value === value,
      },
    ),
  ]),

  t.section('Contact Details', [
    t.text('email', { label: 'Email', placeholder: 'contact@acme.com' }),
    t.text('phone', { label: 'Phone' }),
    t.text('address', { label: 'Address', multiline: true }),
  ]),

  t.section('Classification', [
    // ✅ Taxonomy: t.taxonomy(name, scope, props)
    t.taxonomy('tags', 'vendor_tags', {
      label: 'Tags',
      placeholder: 'e.g. Electrical',
      multiple: true,
    }),

    t.taxonomy('details.category' as any, 'entity_categories', {
      label: 'Category',
      placeholder: 'Select category...',
    }),
  ]),

  t.section('Offerings', [
    t.taxonomy('details.productsOffered', 'product_types', {
      label: 'Products Offered',
      multiple: true,
    }),
    t.taxonomy('details.servicesOffered' as any, 'service_types', {
      label: 'Services Offered',
      multiple: true,
    }),
  ]),
]);

export function EntityFormModal({ onSuccess }: { onSuccess?: () => void }) {
  const { execute, isExecuting } = useRngAction(createEntityAction, {
    successMessage: 'Entity created successfully',
    onSuccess: () => onSuccess?.(),
  });

  return (
    <AppModal
      title="Create New Entity"
      trigger={
        <RNGButton
          startIcon={<Add />}
          rngVariant="primary" // ✅ FIXED: use rngVariant
        >
          New Entity
        </RNGButton>
      }
    >
      {({ close }) => (
        <RNGForm
          schema={CreateEntitySchema}
          uiSchema={entityFormUI}
          onSubmit={async (data) => {
            const res = await execute(data as any);
            if (res) close();
          }}
          submitLabel="Create Entity"
          // If RNGForm supports isLoading, pass it. Otherwise relied on isSubmitting.
        />
      )}
    </AppModal>
  );
}

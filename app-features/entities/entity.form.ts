import { defineForm } from '@/rng-form/dsl';
import { EntitySchema, EntityStatus, EntityType } from './entity.model';

// 1. Zod Schema Pick
export const EntityFormSchema = EntitySchema.pick({
  name: true,
  type: true,
  status: true,
  email: true,
  phone: true,
  address: true,
  tags: true,
  notes: true,
  details: true,
});

// 2. UI Layout
export const entityFormUI = defineForm<typeof EntityFormSchema>((t) => [
  t.section('Basic Info', [
    t.text('name', {
      label: 'Entity Name',
      required: true,
      placeholder: 'e.g. Acme Corp',
      colProps: { size: { xs: 12, md: 4 } },
      autoFocus: true,
    }),
    t.select(
      'type',
      [
        { label: 'Client', value: EntityType.CLIENT },
        { label: 'Vendor', value: EntityType.VENDOR },
        { label: 'Contractor', value: EntityType.CONTRACTOR },
        { label: 'Consultant', value: EntityType.CONSULTANT },
      ],
      { label: 'Type', required: true, colProps: { size: { xs: 12, md: 4 } } },
    ),
    t.select(
      'status',
      [
        { label: 'Active', value: EntityStatus.ACTIVE },
        { label: 'Inactive', value: EntityStatus.INACTIVE },
        { label: 'Blacklisted', value: EntityStatus.BLACKLISTED },
      ],
      { label: 'Status', colProps: { size: { xs: 12, md: 4 } } },
    ),
  ]),

  t.section('Contact Information', [
    t.text('email', { label: 'Primary Email', colProps: { size: { xs: 12, md: 4 } } }),
    t.text('phone', { label: 'Primary Phone', colProps: { size: { xs: 12, md: 4 } } }),
    t.text('address', {
      label: 'Full Address',
      multiline: true,
      colProps: { size: { xs: 12, md: 4 } },
    }),
  ]),

  t.section('Classification', [
    t.taxonomy('tags', 'vendor_tags', {
      label: 'Tags',
      multiple: true,
      colProps: { size: { xs: 12, md: 6 } },
    }),
    t.taxonomy('details.category' as any, 'entity_categories', {
      label: 'Category',
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),

  t.section('Offerings', [
    t.taxonomy('details.productsOffered' as any, 'product_types', {
      label: 'Products',
      multiple: true,
      colProps: { size: { xs: 12, md: 6 } },
    }),
    t.taxonomy('details.servicesOffered' as any, 'service_types', {
      label: 'Services',
      multiple: true,
      colProps: { size: { xs: 12, md: 6 } },
    }),
  ]),

  // ✅ NEW: Financial Terms
  t.section('Financial Terms', [
    t.number('details.financialTerms.standardDiscountPercent' as any, {
      label: 'Standard Discount (%)',
      placeholder: '20',
    }),
    t.text('details.financialTerms.paymentTerms' as any, {
      label: 'Payment Terms',
      placeholder: 'e.g. Net 30',
    }),
  ]),

  // ✅ NEW: Points of Contact (Array)
  t.array('details.pointOfContacts' as any, {
    itemLabel: 'Contact',
    items: [
      t.text('name' as any, { label: 'Name', required: true }),
      t.text('role' as any, { label: 'Role / Job Title' }),
      t.text('email' as any, { label: 'Email' }),
      t.text('phone' as any, { label: 'Phone' }),
      t.switch('isPrimary' as any, { label: 'Primary Contact' }),
    ],
  }),
  t.section('Internal Notes', [t.text('notes', { label: 'Notes', multiline: true, rows: 3 })]),
]);

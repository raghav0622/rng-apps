import { AnyFieldType } from './types/field-registry';

interface FieldConfig {
  /** If true, the component handles its own label rendering, so FieldWrapper shouldn't render one. */
  hasInternalLabel?: boolean;
}

// Strictly typed against AnyFieldType to ensure no field is missed
export const FIELD_CONFIG: Record<AnyFieldType, FieldConfig> = {
  // Primitives
  text: { hasInternalLabel: true },
  password: { hasInternalLabel: true },
  number: { hasInternalLabel: true },
  date: { hasInternalLabel: true },
  hidden: { hasInternalLabel: false },
  'masked-text': { hasInternalLabel: true },
  color: { hasInternalLabel: true },
  otp: { hasInternalLabel: true },
  calculated: { hasInternalLabel: true },

  // Selection
  switch: { hasInternalLabel: false },
  'checkbox-group': { hasInternalLabel: false },
  radio: { hasInternalLabel: false },
  'toggle-group': { hasInternalLabel: false },
  slider: { hasInternalLabel: false },
  rating: { hasInternalLabel: false },
  autocomplete: { hasInternalLabel: true },
  'async-autocomplete': { hasInternalLabel: true },
  'transfer-list': { hasInternalLabel: false },

  // Advanced
  file: { hasInternalLabel: false },
  'rich-text': { hasInternalLabel: false },
  signature: { hasInternalLabel: false },
  'date-range': { hasInternalLabel: true },

  // NEW FIELDS
  avatar: { hasInternalLabel: true }, // Avatar handles its own label/layout
  'multi-image-editor': { hasInternalLabel: false }, // Use standard label from FieldWrapper

  // Layouts
  section: { hasInternalLabel: true },
  tabs: { hasInternalLabel: true },
  accordion: { hasInternalLabel: true },
  wizard: { hasInternalLabel: true },
  stepper: { hasInternalLabel: true },
  'modal-form': { hasInternalLabel: true },
  array: {},
  'data-grid': {},
};

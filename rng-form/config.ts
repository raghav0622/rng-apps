import { AnyFieldType } from './types/field-registry';

interface FieldConfig {
  /** If true, the component handles its own label rendering, so FieldWrapper shouldn't render one. */
  hasInternalLabel?: boolean;
}

// Strictly typed against AnyFieldType to ensure no field is missed
export const FIELD_CONFIG: Record<AnyFieldType, FieldConfig> = {
  // Primitives
  text: {},
  password: {},
  number: {},
  date: {},
  hidden: { hasInternalLabel: true },
  'masked-text': {},
  color: {},
  otp: {},
  calculated: {},

  // Selection
  switch: { hasInternalLabel: true },
  'checkbox-group': { hasInternalLabel: true },
  radio: { hasInternalLabel: true },
  'toggle-group': {},
  slider: {},
  rating: {},
  autocomplete: {},
  'async-autocomplete': {},
  'transfer-list': {},

  // Advanced
  file: { hasInternalLabel: true },
  'rich-text': {},
  signature: {},
  'date-range': {},

  // NEW FIELDS
  avatar: { hasInternalLabel: true }, // Avatar handles its own label/layout
  'multi-image-editor': {}, // Use standard label from FieldWrapper

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

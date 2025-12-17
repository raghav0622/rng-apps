import { FieldType } from './types';

interface FieldConfig {
  /** If true, the component handles its own label rendering, so FieldWrapper shouldn't render one. */
  hasInternalLabel?: boolean;
}

export const FIELD_CONFIG: Record<FieldType, FieldConfig> = {
  // Primitives
  text: {},
  password: {},
  number: {},
  currency: {},
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
  'toggle-group': {}, // Usually needs a label
  slider: {},
  rating: {},
  autocomplete: {},
  'async-autocomplete': {},
  'transfer-list': {},

  // Complex
  file: { hasInternalLabel: true },
  'rich-text': {},
  signature: {},
  location: {},
  'date-range': {},

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

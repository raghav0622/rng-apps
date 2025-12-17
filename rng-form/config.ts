import { AnyFieldType } from './types/field-registry';

interface FieldConfig {
  hasInternalLabel?: boolean;
}

export const FIELD_CONFIG: Record<AnyFieldType, FieldConfig> = {
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

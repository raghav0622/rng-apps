import { AnyFieldType } from './types/field-registry';

interface FieldConfig {
  hasInternalLabel?: boolean;
}

export const FIELD_CONFIG: Record<AnyFieldType, FieldConfig> = {
  // Primitives: ALL FALSE (Wrapper renders label)
  text: { hasInternalLabel: false },
  password: { hasInternalLabel: false },
  number: { hasInternalLabel: false },
  date: { hasInternalLabel: false },
  'masked-text': { hasInternalLabel: false },
  color: { hasInternalLabel: false },
  otp: { hasInternalLabel: false },
  calculated: { hasInternalLabel: false },

  // Selection: ALL FALSE
  select: { hasInternalLabel: false },
  switch: { hasInternalLabel: false }, // Wrapper renders "Notification Settings *", Switch renders "Enable"
  'checkbox-group': { hasInternalLabel: false },
  radio: { hasInternalLabel: false },
  'toggle-group': { hasInternalLabel: false },
  slider: { hasInternalLabel: false },
  rating: { hasInternalLabel: false },
  autocomplete: { hasInternalLabel: false },
  'async-autocomplete': { hasInternalLabel: false },
  taxonomy: { hasInternalLabel: false },
  'transfer-list': { hasInternalLabel: false },

  // Advanced: ALL FALSE
  file: { hasInternalLabel: false },
  'rich-text': { hasInternalLabel: false },
  signature: { hasInternalLabel: false },
  'date-range': { hasInternalLabel: false },
  avatar: { hasInternalLabel: false },
  'multi-image-editor': { hasInternalLabel: false },

  // Hidden doesn't matter, it doesn't render
  hidden: { hasInternalLabel: true },

  // Layouts: These are containers, they usually manage their own "Titles" via props.title
  // We keep them as TRUE so FieldWrapper doesn't wrap a Section in a Label tag.
  section: { hasInternalLabel: true },
  tabs: { hasInternalLabel: true },
  accordion: { hasInternalLabel: true },
  wizard: { hasInternalLabel: true },
  stepper: { hasInternalLabel: true },
  'modal-form': { hasInternalLabel: true },
  array: { hasInternalLabel: true },
  'data-grid': { hasInternalLabel: true },
};

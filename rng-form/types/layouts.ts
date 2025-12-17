import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './core';

// =============================================================================
// PRIMITIVE FIELDS
// =============================================================================

export type TextFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'text' | 'password';
  name: Path<z.infer<S>>;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

export type NumberFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'number' | 'currency';
  name: Path<z.infer<S>>;
  min?: number;
  max?: number;
  placeholder?: string;
};

export type DateFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'date';
  name: Path<z.infer<S>>;
  minDate?: Date;
  maxDate?: Date;
};

export type HiddenFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'hidden';
  name: Path<z.infer<S>>;
};

export type MaskedTextItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'masked-text';
  name: Path<z.infer<S>>;
  mask: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions?: Record<string, any>;
  placeholder?: string;
};

export type CalculatedItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'calculated';
  name: Path<z.infer<S>>;
  calculate: (values: z.infer<S>) => string | number;
};

export type ColorItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'color';
  name: Path<z.infer<S>>;
};

export type OtpItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'otp';
  name: Path<z.infer<S>>;
  length?: number;
};

// =============================================================================
// SELECTION FIELDS
// =============================================================================

export type RadioOption = {
  label: string;
  value: string | number | boolean;
  icon?: React.ReactNode;
};

export type SwitchFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'switch';
  name: Path<z.infer<S>>;
};

export type SliderItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'slider';
  name: Path<z.infer<S>>;
  min?: number;
  max?: number;
  step?: number;
};

export type RatingItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'rating';
  name: Path<z.infer<S>>;
  max?: number;
  precision?: number;
};

export type RadioGroupItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'radio';
  name: Path<z.infer<S>>;
  options: RadioOption[];
  row?: boolean;
};

export type CheckboxGroupItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'checkbox-group';
  name: Path<z.infer<S>>;
  options: RadioOption[];
  row?: boolean;
};

export type ToggleGroupItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'toggle-group';
  name: Path<z.infer<S>>;
  options: RadioOption[];
  exclusive?: boolean;
};

export type TransferListItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'transfer-list';
  name: Path<z.infer<S>>;
  options: RadioOption[];
  titles?: [string, string];
};

export type AutocompleteOption = string | Record<string, unknown>;

export type AutocompleteItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'autocomplete';
  name: Path<z.infer<S>>;
  options: readonly AutocompleteOption[];
  getOptionLabel?: (option: AutocompleteOption) => string;
  creatable?: boolean;
  multiple?: boolean;
};

export type AsyncAutocompleteItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'async-autocomplete';
  name: Path<z.infer<S>>;
  loadOptions: (query: string, values: z.infer<S>) => Promise<AutocompleteOption[]>;
  getOptionLabel?: (option: AutocompleteOption) => string;
  multiple?: boolean;
};

// =============================================================================
// ADVANCED FIELDS
// =============================================================================

export type FileItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'file';
  name: Path<z.infer<S>>;
  accept?: string;
  multiple?: boolean;
};

export type RichTextItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'rich-text';
  name: Path<z.infer<S>>;
  minHeight?: string | number;
  placeholder?: string;
};

export type SignatureItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'signature';
  name: Path<z.infer<S>>;
  height?: number;
};

export type LocationItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'location';
  name: Path<z.infer<S>>;
  placeholder?: string;
  provider?: 'google' | 'mapbox' | 'mock';
};

export type DateRangeItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'date-range';
  name: Path<z.infer<S>>;
  minDate?: Date;
  maxDate?: Date;
};

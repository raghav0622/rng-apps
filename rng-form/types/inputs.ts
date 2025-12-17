import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FieldType, FormSchema } from './core';

/** Helper to reduce boilerplate for specific item definitions */
type DefineItem<
  S extends FormSchema,
  T extends FieldType,
  ExtraProps = unknown,
> = BaseFormItem<S> & { type: T; name: Path<z.infer<S>> } & ExtraProps;

// =============================================================================
// PRIMITIVE FIELDS
// =============================================================================

export type TextFieldItem<S extends FormSchema> = DefineItem<
  S,
  'text' | 'password',
  {
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
  }
>;

export type NumberFieldItem<S extends FormSchema> = DefineItem<
  S,
  'number' | 'currency',
  {
    min?: number;
    max?: number;
    placeholder?: string;
  }
>;

export type DateFieldItem<S extends FormSchema> = DefineItem<
  S,
  'date',
  {
    minDate?: Date;
    maxDate?: Date;
  }
>;

export type HiddenFieldItem<S extends FormSchema> = DefineItem<S, 'hidden'>;

export type MaskedTextItem<S extends FormSchema> = DefineItem<
  S,
  'masked-text',
  {
    mask: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    definitions?: Record<string, any>;
    placeholder?: string;
  }
>;

export type CalculatedItem<S extends FormSchema> = DefineItem<
  S,
  'calculated',
  {
    calculate: (values: z.infer<S>) => string | number;
  }
>;

export type ColorItem<S extends FormSchema> = DefineItem<S, 'color'>;

export type OtpItem<S extends FormSchema> = DefineItem<
  S,
  'otp',
  {
    length?: number;
  }
>;

// =============================================================================
// SELECTION FIELDS
// =============================================================================

export type RadioOption = {
  label: string;
  value: string | number | boolean;
  icon?: React.ReactNode;
};

type BaseSelectionProps = {
  options: RadioOption[];
};

export type SwitchFieldItem<S extends FormSchema> = DefineItem<S, 'switch'>;

export type SliderItem<S extends FormSchema> = DefineItem<
  S,
  'slider',
  {
    min?: number;
    max?: number;
    step?: number;
  }
>;

export type RatingItem<S extends FormSchema> = DefineItem<
  S,
  'rating',
  {
    max?: number;
    precision?: number;
  }
>;

export type RadioGroupItem<S extends FormSchema> = DefineItem<
  S,
  'radio',
  BaseSelectionProps & {
    row?: boolean;
  }
>;

export type CheckboxGroupItem<S extends FormSchema> = DefineItem<
  S,
  'checkbox-group',
  BaseSelectionProps & {
    row?: boolean;
  }
>;

export type ToggleGroupItem<S extends FormSchema> = DefineItem<
  S,
  'toggle-group',
  BaseSelectionProps & {
    exclusive?: boolean;
  }
>;

export type TransferListItem<S extends FormSchema> = DefineItem<
  S,
  'transfer-list',
  BaseSelectionProps & {
    titles?: [string, string];
  }
>;

export type AutocompleteOption = string | Record<string, unknown>;

export type AutocompleteItem<S extends FormSchema> = DefineItem<
  S,
  'autocomplete',
  {
    options: readonly AutocompleteOption[];
    getOptionLabel?: (option: AutocompleteOption) => string;
    creatable?: boolean;
    multiple?: boolean;
  }
>;

export type AsyncAutocompleteItem<S extends FormSchema> = DefineItem<
  S,
  'async-autocomplete',
  {
    loadOptions: (query: string, values: z.infer<S>) => Promise<AutocompleteOption[]>;
    getOptionLabel?: (option: AutocompleteOption) => string;
    multiple?: boolean;
  }
>;

// =============================================================================
// ADVANCED FIELDS
// =============================================================================

export type FileItem<S extends FormSchema> = DefineItem<
  S,
  'file',
  {
    accept?: string;
    multiple?: boolean;
  }
>;

export type RichTextItem<S extends FormSchema> = DefineItem<
  S,
  'rich-text',
  {
    minHeight?: string | number;
    placeholder?: string;
  }
>;

export type SignatureItem<S extends FormSchema> = DefineItem<
  S,
  'signature',
  {
    height?: number;
  }
>;

export type LocationItem<S extends FormSchema> = DefineItem<
  S,
  'location',
  {
    placeholder?: string;
    provider?: 'google' | 'mapbox' | 'mock';
  }
>;

export type DateRangeItem<S extends FormSchema> = DefineItem<
  S,
  'date-range',
  {
    minDate?: Date;
    maxDate?: Date;
  }
>;

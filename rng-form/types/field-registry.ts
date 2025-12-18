/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { FormSchema } from './core';

// =============================================================================
// PROP DEFINITIONS
// =============================================================================

export type AutocompleteOption = string | Record<string, unknown>;
export type RadioOption = {
  label: string;
  value: string | number | boolean;
  icon?: React.ReactNode;
};

// Workaround for ESLint rule @typescript-eslint/no-empty-object-type
// We use {} to ensure strict type checking (no extra props allowed) while
// allowing intersection with BaseFormItem. 'object' or 'unknown' would be too loose.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EmptyProps = {};

/**
 * Registry of all Input Field Props.
 * Key = Field Type
 * Value = Specific Props for that field
 */
export interface InputFieldRegistry<S extends FormSchema> {
  // Primitives
  text: { placeholder?: string; multiline?: boolean; rows?: number };
  password: { placeholder?: string };
  number: { min?: number; max?: number; placeholder?: string };
  currency: { min?: number; max?: number; placeholder?: string; currencyCode?: string };
  date: { minDate?: Date; maxDate?: Date };

  // FIX: Use EmptyProps to allow intersection with BaseFormItem
  hidden: EmptyProps;
  color: EmptyProps;
  switch: EmptyProps;

  // Specialized
  'masked-text': { mask: string; definitions?: Record<string, unknown>; placeholder?: string };
  calculated: { calculate: (values: z.infer<S>) => string | number };
  otp: { length?: number };

  // Selection
  slider: { min?: number; max?: number; step?: number };
  rating: { max?: number; precision?: number };
  radio: { options: RadioOption[]; row?: boolean };
  'checkbox-group': { options: RadioOption[]; row?: boolean };
  'toggle-group': { options: RadioOption[]; exclusive?: boolean };
  'transfer-list': { options: RadioOption[]; titles?: [string, string] };

  autocomplete: {
    options: readonly AutocompleteOption[];
    getOptionLabel?: (option: AutocompleteOption) => string;
    creatable?: boolean;
    multiple?: boolean;
    placeholder?: string;
  };
  'async-autocomplete': {
    loadOptions: (query: string, values: z.infer<S>) => Promise<AutocompleteOption[]>;
    getOptionLabel?: (option: AutocompleteOption) => string;
    multiple?: boolean;
    placeholder?: string;
  };

  // Advanced
  // FIX: Added placeholder here to resolve the TypeScript error
  file: { accept?: string; multiple?: boolean; placeholder?: string };
  'rich-text': { minHeight?: string | number; placeholder?: string };
  signature: { height?: number };
  location: { placeholder?: string; provider?: 'google' | 'mapbox' | 'mock' };
  'date-range': { minDate?: Date; maxDate?: Date };
}

/**
 * Registry of Layout/Container Props.
 * We use `ItemType` generic to avoid circular dependency on FormItem.
 */

export interface LayoutRegistry<S extends FormSchema, ItemType = any> {
  section: { title?: string; children: ItemType[] };
  tabs: { tabs: { label: string; children: ItemType[] }[] };
  accordion: { items: { title: string; defaultExpanded?: boolean; children: ItemType[] }[] };
  wizard: { steps: { label: string; description?: string; children: ItemType[] }[] };
  stepper: { activeStepIndex?: number; steps: { label: string; description?: string }[] };
  'modal-form': { triggerLabel: string; dialogTitle?: string; children: ItemType[] };

  // Data Iterators
  array: {
    // We handle 'name' specifically in the final type to ensure strict Path<> typing
    name: any;
    itemLabel?: string;
    items: ItemType[];
    defaultValue?: any;
  };
  'data-grid': {
    name: any;
    columns: { header: string; field: ItemType; width?: number | string }[];
    defaultValue?: any;
  };
}

export type InputType = keyof InputFieldRegistry<any>;
export type LayoutType = keyof LayoutRegistry<any>;
export type AnyFieldType = InputType | LayoutType;

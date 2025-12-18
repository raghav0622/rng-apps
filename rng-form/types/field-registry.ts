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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EmptyProps = {};

// --- AUTOCOMPLETE TYPES ---

/** List of standard units for Architecture, Civil, and General Construction */
export type CommonUnit =
  | 'mm'
  | 'cm'
  | 'm'
  | 'km'
  | 'in'
  | 'ft'
  | 'yd'
  | 'mi'
  | 'sqmm'
  | 'sqcm'
  | 'sqm'
  | 'sqkm'
  | 'sqin'
  | 'sqft'
  | 'sqyd'
  | 'sqmi'
  | 'ac'
  | 'ha'
  | 'ml'
  | 'l'
  | 'cum'
  | 'cuft'
  | 'cuyd'
  | 'cuin'
  | 'gal'
  | 'qt'
  | 'pt'
  | 'mg'
  | 'g'
  | 'kg'
  | 't'
  | 'oz'
  | 'lb'
  | 'ton'
  | 'n'
  | 'kn'
  | 'pa'
  | 'kpa'
  | 'mpa'
  | 'bar'
  | 'psi'
  | 'c'
  | 'f'
  | 'deg'
  | 'b'
  | 'kb'
  | 'mb'
  | 'gb'
  | 'tb'
  | (string & {});

export type CommonCurrency = 'INR' | (string & {});

/**
 * Configuration for Number Formatting
 */
export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'unit' | 'percent';
  /** Currency code (e.g. USD, INR) */
  currency?: CommonCurrency;
  /** Unit of measurement (e.g. kg, ft, sqft) */
  unit?: CommonUnit;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Registry of all Input Field Props.
 */
export interface InputFieldRegistry<S extends FormSchema> {
  // Primitives
  text: { placeholder?: string; multiline?: boolean; rows?: number };
  password: { placeholder?: string };

  // Unified Number
  number: {
    min?: number;
    max?: number;
    placeholder?: string;
    formatOptions?: NumberFormatOptions;
    /**
     * If true, allows entering math expressions (e.g., "100 + 50 * 2")
     * which are evaluated on blur.
     */
    enableMath?: boolean;
  };

  date: { minDate?: Date; maxDate?: Date };
  hidden: EmptyProps;
  color: EmptyProps;
  switch: EmptyProps;

  // Specialized
  'masked-text': { mask: string; definitions?: Record<string, unknown>; placeholder?: string };

  // Calculated now supports formatting
  calculated: {
    calculate: (values: z.infer<S>) => string | number;
    formatOptions?: NumberFormatOptions;
  };

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
  file: { accept?: string; multiple?: boolean; placeholder?: string };
  'rich-text': { minHeight?: string | number; placeholder?: string };
  signature: { height?: number };

  // NEW: Image Uploaders
  avatar: {
    placeholder?: string;
    alt?: string;
    width?: number; // Visual width in px
  };

  'multi-image-editor': {
    placeholder?: string;
    maxFiles?: number;
    aspectRatio?: number; // Force aspect ratio for cropping (e.g., 16/9)
  };

  'date-range': { minDate?: Date; maxDate?: Date };
}

// Layout Registry (Standard)
export interface LayoutRegistry<S extends FormSchema, ItemType = any> {
  section: { title?: string; children: ItemType[] };
  tabs: { tabs: { label: string; children: ItemType[] }[] };
  accordion: { items: { title: string; defaultExpanded?: boolean; children: ItemType[] }[] };
  wizard: { steps: { label: string; description?: string; children: ItemType[] }[] };
  stepper: { activeStepIndex?: number; steps: { label: string; description?: string }[] };
  'modal-form': { triggerLabel: string; dialogTitle?: string; children: ItemType[] };
  array: { name: any; itemLabel?: string; items: ItemType[]; defaultValue?: any };
  'data-grid': {
    name: any;
    columns: { header: string; field: ItemType; width?: number | string }[];
    defaultValue?: any;
  };
}

export type InputType = keyof InputFieldRegistry<any>;
export type LayoutType = keyof LayoutRegistry<any>;
export type AnyFieldType = InputType | LayoutType;

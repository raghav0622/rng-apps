import { GridProps } from '@mui/material/Grid';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// =============================================================================
// CORE SCHEMA TYPES
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = z.ZodType<FieldValues, any, any>;

export type FormContextState<TFieldValues extends FieldValues = FieldValues> = {
  formId: string;
  methods: UseFormReturn<TFieldValues>;
  readOnly?: boolean;
};

// =============================================================================
// FIELD REGISTRY KEYS
// =============================================================================

export type FieldType =
  // Primitives
  | 'text'
  | 'password'
  | 'number'
  | 'currency'
  | 'date'
  | 'hidden'
  | 'masked-text'
  // Selection
  | 'switch'
  | 'checkbox-group'
  | 'radio'
  | 'slider'
  | 'rating'
  | 'autocomplete'
  | 'async-autocomplete'
  // Complex / Layout
  | 'rich-text'
  | 'file'
  | 'array'
  | 'section'
  | 'tabs'
  | 'accordion'
  | 'wizard'
  | 'calculated';

// =============================================================================
// BASE ITEM CONFIGURATION
// =============================================================================

export type BaseFormItem<Schema extends FormSchema> = {
  /** The specific type of input to render */
  type: FieldType;
  /** The path to the field in the Zod schema */
  name?: Path<z.infer<Schema>>;
  /** Visual label for the input */
  label?: string;
  /** Helper text or description displayed below the input */
  description?: string | React.ReactNode;
  /** Grid Layout props (MUI Grid 2 size, offset, etc) */
  colProps?: GridProps;
  /** Fields that this field depends on for logic */
  dependencies?: Path<z.infer<Schema>>[];
  /** Logic: Return false to hide the field */
  renderLogic?: (values: z.infer<Schema>) => boolean;
  /** Logic: Return partial props to dynamically override (e.g., disabled, label) */
  propsLogic?: (values: z.infer<Schema>) => Partial<FormItem<Schema>>;
  /** Disable the input */
  disabled?: boolean;
};

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

// =============================================================================
// SELECTION FIELDS
// =============================================================================

export type RadioOption = { label: string; value: string | number | boolean };

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
// ADVANCED & LAYOUT FIELDS
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

export type SectionItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'section';
  title?: string;
  children: FormItem<S>[];
};

export type TabsItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'tabs';
  tabs: {
    label: string;
    children: FormItem<S>[];
  }[];
};

export type AccordionItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'accordion';
  items: {
    title: string;
    defaultExpanded?: boolean;
    children: FormItem<S>[];
  }[];
};

export type WizardItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'wizard';
  steps: {
    label: string;
    description?: string;
    children: FormItem<S>[];
  }[];
};

export type ArrayItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'array';
  name: Path<z.infer<S>>;
  itemLabel?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: FormItem<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
};

// =============================================================================
// UNION EXPORT
// =============================================================================

export type FormItem<S extends FormSchema> =
  | TextFieldItem<S>
  | NumberFieldItem<S>
  | DateFieldItem<S>
  | HiddenFieldItem<S>
  | MaskedTextItem<S>
  | CalculatedItem<S>
  | SwitchFieldItem<S>
  | SliderItem<S>
  | RatingItem<S>
  | RadioGroupItem<S>
  | CheckboxGroupItem<S>
  | AutocompleteItem<S>
  | AsyncAutocompleteItem<S>
  | FileItem<S>
  | RichTextItem<S>
  | SectionItem<S>
  | TabsItem<S>
  | AccordionItem<S>
  | WizardItem<S>
  | ArrayItem<S>;

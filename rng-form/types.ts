import { GridProps } from '@mui/material/Grid';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// --- Core Types ---

export type FieldType =
  | 'text'
  | 'password'
  | 'number'
  | 'currency'
  | 'switch'
  | 'autocomplete'
  | 'date'
  | 'hidden'
  | 'rich-text'
  | 'async-autocomplete'
  | 'array'
  | 'section'
  | 'file'
  | 'slider'
  | 'radio'
  | 'rating'
  | 'checkbox-group'
  | 'tabs'
  | 'accordion'
  | 'wizard'
  // MISSING TYPES ADDED BACK:
  | 'masked-text'
  | 'calculated';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = z.ZodType<FieldValues, any, any>;

// --- Base Item ---

export type BaseFormItem<Schema extends FormSchema> = {
  name?: Path<z.infer<Schema>>;
  label?: string;
  type: FieldType;
  description?: string | React.ReactNode;
  colProps?: GridProps;
  dependencies?: Path<z.infer<Schema>>[];
  renderLogic?: (values: z.infer<Schema>) => boolean;
  propsLogic?: (values: z.infer<Schema>) => Partial<FormItem<Schema>>; // Added propsLogic
  disabled?: boolean;
};

// --- Basic Inputs ---
export type TextFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'text' | 'password';
  name: Path<z.infer<S>>;
  placeholder?: string;
};
export type NumberFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'number' | 'currency';
  min?: number;
  max?: number;
  name: Path<z.infer<S>>;
};
export type DateFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'date';
  minDate?: Date;
  maxDate?: Date;
  name: Path<z.infer<S>>;
};
export type SwitchFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'switch';
  name: Path<z.infer<S>>;
};
export type HiddenFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'hidden';
  name: Path<z.infer<S>>;
};

// --- NEW: Masked Input ---
export type MaskedTextItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'masked-text';
  mask: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  definitions?: Record<string, any>;
  placeholder?: string;
  name: Path<z.infer<S>>;
};

// --- NEW: Calculated Field ---

export type CalculatedItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'calculated';
  calculate: (values: z.infer<S>) => string | number;
  name: Path<z.infer<S>>; // ✅ Changed from optional (?) to required
};

// --- Simple Inputs ---
export type SliderItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'slider';
  min?: number;
  max?: number;
  step?: number;
  name: Path<z.infer<S>>;
};

export type RadioOption = { label: string; value: string | number | boolean };
export type RadioGroupItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'radio';
  options: RadioOption[];
  row?: boolean;
  name: Path<z.infer<S>>;
};

export type RatingItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'rating';
  max?: number;
  precision?: number;
  name: Path<z.infer<S>>;
};

export type CheckboxGroupItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'checkbox-group';
  options: RadioOption[];
  row?: boolean;
  name: Path<z.infer<S>>;
};

// --- Advanced Inputs ---
export type FileItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'file';
  accept?: string;
  multiple?: boolean;
  name: Path<z.infer<S>>;
};

// --- Autocomplete Types ---
export type AutocompleteOption = string | Record<string, unknown>;

export type AutocompleteItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'autocomplete';
  options: readonly AutocompleteOption[];
  getOptionLabel?: (option: AutocompleteOption) => string;
  creatable?: boolean;
  multiple?: boolean;
  name: Path<z.infer<S>>;
};

export type AsyncAutocompleteItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'async-autocomplete';
  loadOptions: (query: string, values: z.infer<S>) => Promise<AutocompleteOption[]>;
  getOptionLabel?: (option: AutocompleteOption) => string;
  multiple?: boolean;
  name: Path<z.infer<S>>;
};

// --- Layout & Content ---
export type RichTextItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'rich-text';
  minHeight?: string | number;
  placeholder?: string;
  name: Path<z.infer<S>>;
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

// --- Union Type ---
export type FormItem<S extends FormSchema> =
  | TextFieldItem<S>
  | NumberFieldItem<S>
  | DateFieldItem<S>
  | SwitchFieldItem<S>
  | SliderItem<S>
  | RadioGroupItem<S>
  | RatingItem<S>
  | CheckboxGroupItem<S>
  | FileItem<S>
  | AutocompleteItem<S>
  | AsyncAutocompleteItem<S>
  | RichTextItem<S>
  | SectionItem<S>
  | TabsItem<S>
  | AccordionItem<S>
  | WizardItem<S>
  | ArrayItem<S>
  | HiddenFieldItem<S>
  // ADDED:
  | MaskedTextItem<S>
  | CalculatedItem<S>;

export type FormContextState<TFieldValues extends FieldValues = FieldValues> = {
  formId: string;
  methods: UseFormReturn<TFieldValues>;
};

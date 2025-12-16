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
  // New Types
  | 'rich-text'
  | 'async-autocomplete'
  | 'array'
  | 'section';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = z.ZodType<FieldValues, any, any>;

// --- Base Item ---

export type BaseFormItem<Schema extends FormSchema> = {
  // Name is optional for Sections, but required for Inputs
  name?: Path<z.infer<Schema>>;
  label?: string;
  type: FieldType;
  description?: string | React.ReactNode;
  colProps?: GridProps;

  // Optimization: Only re-render wrapper if these specific fields change
  dependencies?: Path<z.infer<Schema>>[];

  renderLogic?: (values: z.infer<Schema>) => boolean;
  disabled?: boolean;
};

// --- Existing Input Types (Unchanged/Briefly listed) ---
export type TextFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'text' | 'password';
  name: Path<z.infer<S>>;
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

// --- NEW TYPES START HERE ---

// 1. Async Autocomplete
export type AsyncAutocompleteItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'async-autocomplete';
  loadOptions: (query: string) => Promise<AutocompleteOption[]>;
  getOptionLabel?: (option: AutocompleteOption) => string;
  multiple?: boolean;
  name: Path<z.infer<S>>;
};

// 2. Rich Text (Tiptap)
export type RichTextItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'rich-text';
  minHeight?: string | number;
  placeholder?: string;
  name: Path<z.infer<S>>;
};

// 3. Section (Layout Group)
export type SectionItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'section';
  title?: string; // Optional Header
  children: FormItem<S>[]; // Recursive Children
};

// 4. Array (Repeater)
export type ArrayItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'array';
  name: Path<z.infer<S>>;
  itemLabel?: string; // e.g. "Add Experience"
  // FIX: Use FormItem<any> to allow relative paths (e.g. 'school') instead of requiring root paths (e.g. 'education.0.school')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: FormItem<any>[];
  // Default value for new items (prevents uncontrolled warnings)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
};

// --- Union Type ---
export type FormItem<S extends FormSchema> =
  | TextFieldItem<S>
  | NumberFieldItem<S>
  | DateFieldItem<S>
  | SwitchFieldItem<S>
  | AutocompleteItem<S>
  | AsyncAutocompleteItem<S>
  | RichTextItem<S>
  | SectionItem<S>
  | ArrayItem<S>
  | HiddenFieldItem<S>;

export type FormContextState<TFieldValues extends FieldValues = FieldValues> = {
  formId: string;
  methods: UseFormReturn<TFieldValues>;
};

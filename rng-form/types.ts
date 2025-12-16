import { GridProps } from '@mui/material/Grid';
import { Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// The types of inputs our library supports
export type FieldType =
  | 'text'
  | 'password'
  | 'number'
  | 'currency'
  | 'switch'
  | 'autocomplete'
  | 'date'
  | 'hidden';

// Base props shared by all form items
export type BaseFormItem<Schema extends z.ZodTypeAny> = {
  name: Path<z.infer<Schema>>; // Strictly typed to the Zod schema
  label: string;
  type: FieldType;
  description?: string | React.ReactNode;
  colSize?: Pick<GridProps, 'size'>;
  colProps?: Omit<GridProps, 'size'>;

  renderLogic?: (values: z.infer<Schema>) => boolean;

  // Configuration specific to input types
  disabled?: boolean;
  autoFocus?: boolean;
};

// specific prop definitions
export type TextFieldItem<S extends z.ZodTypeAny> = BaseFormItem<S> & {
  type: 'text' | 'password';
};

export type NumberFieldItem<S extends z.ZodTypeAny> = BaseFormItem<S> & {
  type: 'number' | 'currency';
  min?: number;
  max?: number;
};

export type DateFieldItem<S extends z.ZodTypeAny> = BaseFormItem<S> & {
  type: 'date';
  minDate?: Date;
  maxDate?: Date;
};

export type SwitchFieldItem<S extends z.ZodTypeAny> = BaseFormItem<S> & {
  type: 'switch';
};

export type AutocompleteItem<S extends z.ZodTypeAny> = BaseFormItem<S> & {
  type: 'autocomplete';
  options: any[]; // Can be string[] or object[]
  getOptionLabel?: (option: any) => string;
  getOptionValue?: (option: any) => any;
  creatable?: boolean;
  multiple?: boolean;
};

export type HiddenFieldItem<S extends z.ZodTypeAny> = BaseFormItem<S> & {
  type: 'hidden';
};

export type FormItem<S extends z.ZodTypeAny> =
  | TextFieldItem<S>
  | NumberFieldItem<S>
  | DateFieldItem<S>
  | SwitchFieldItem<S>
  | AutocompleteItem<S>
  | HiddenFieldItem<S>;

// Context State
export type FormContextState<S extends z.ZodTypeAny> = {
  formId: string;
  methods: UseFormReturn<z.infer<S>>;
};

import { GridProps } from '@mui/material/Grid';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
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

// Helper type for a Schema that produces FieldValues.
// We use 'any' for the ZodTypeDef and Input to avoid version conflicts (like Zod v4 missing ZodTypeDef),
// but we strictly enforce that the Output matches FieldValues (Record<string, any>).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = z.ZodType<FieldValues, any, any>;

// Base props shared by all form items
export type BaseFormItem<Schema extends FormSchema> = {
  name: Path<z.infer<Schema>>;
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
export type TextFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'text' | 'password';
};

export type NumberFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'number' | 'currency';
  min?: number;
  max?: number;
};

export type DateFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'date';
  minDate?: Date;
  maxDate?: Date;
};

export type SwitchFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'switch';
};

export type AutocompleteOption = string | Record<string, unknown>;

export type AutocompleteItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'autocomplete';
  options: readonly AutocompleteOption[];
  getOptionLabel?: (option: AutocompleteOption) => string;
  getOptionValue?: (option: AutocompleteOption) => string | number | undefined;
  creatable?: boolean;
  multiple?: boolean;
};

export type HiddenFieldItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'hidden';
};

export type FormItem<S extends FormSchema> =
  | TextFieldItem<S>
  | NumberFieldItem<S>
  | DateFieldItem<S>
  | SwitchFieldItem<S>
  | AutocompleteItem<S>
  | HiddenFieldItem<S>;

// Context State
export type FormContextState<TFieldValues extends FieldValues = FieldValues> = {
  formId: string;
  methods: UseFormReturn<TFieldValues>;
};

import { GridProps } from '@mui/material/Grid';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = z.ZodType<FieldValues, any, any>;

export type FormContextState<TFieldValues extends FieldValues = FieldValues> = {
  formId: string;
  methods: UseFormReturn<TFieldValues>;
  readOnly?: boolean;
};

export type FieldType =
  // Primitives
  | 'text'
  | 'password'
  | 'number'
  | 'currency'
  | 'date'
  | 'hidden'
  | 'masked-text'
  | 'color'
  | 'otp'
  // Selection
  | 'switch'
  | 'checkbox-group'
  | 'radio'
  | 'toggle-group'
  | 'slider'
  | 'rating'
  | 'autocomplete'
  | 'async-autocomplete'
  | 'transfer-list'
  // Complex / Layout
  | 'rich-text'
  | 'file'
  | 'signature'
  | 'location'
  | 'date-range'
  | 'array'
  | 'data-grid'
  | 'section'
  | 'tabs'
  | 'accordion'
  | 'wizard'
  | 'stepper'
  | 'modal-form'
  | 'calculated';

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
  /** Logic: Return partial props to dynamically override */
  propsLogic?: (values: z.infer<Schema>) => Partial<BaseFormItem<Schema>>;
  /** Disable the input */
  disabled?: boolean;
};

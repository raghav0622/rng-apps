import { GridProps } from '@mui/material/Grid';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// Stricter schema definition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = z.ZodType<any, any, any>;

export type FormContextState<TFieldValues extends FieldValues = FieldValues> = {
  formId: string;
  methods: UseFormReturn<TFieldValues>;
  readOnly?: boolean;
};

// Base Item Definition used by all fields
export type BaseFormItem<Schema extends FormSchema> = {
  /** The specific type of input to render */
  type: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propsLogic?: (values: z.infer<Schema>) => Partial<any>;
  /** Disable the input */
  disabled?: boolean;
  /** ID for testing or dom selection */
  id?: string;
};

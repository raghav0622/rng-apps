import { GridProps } from '@mui/material/Grid';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

// Stricter schema definition

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

  /** * Fields that this field depends on.
   * - Relative paths: "age" (looks inside current scope)
   * - Global paths: "!settings.mode" (looks at root)
   */
  dependencies?: string[];

  /** * Logic: Return false to hide the field
   * @param scope - The values relative to the current nesting (e.g., current array item)
   * @param root - The global form values
   */

  renderLogic?: (scope: any, root: z.infer<Schema>) => boolean;

  /** * Logic: Return partial props to dynamically override
   * @param scope - The values relative to the current nesting (e.g., current array item)
   * @param root - The global form values
   */

  propsLogic?: (scope: any, root: z.infer<Schema>) => Partial<any>;

  /** Disable the input */
  disabled?: boolean;
  /** ID for testing or dom selection */
  id?: string;
  autoFocus?: boolean;
};

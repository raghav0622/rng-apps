import { ControllerFieldState, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { BaseFormItem, FormSchema } from './core';

/**
 * Standardized Props Interface for all RNG Form Inputs.
 * * Usage:
 * export function RNGTextInput<S extends FormSchema>({
 * item,
 * field,
 * fieldState
 * }: RNGInputProps<S, TextFieldItem<S>>) { ... }
 */
export interface RNGInputProps<S extends FormSchema, T extends BaseFormItem<S>> {
  /** The full configuration object for this field (label, description, props, etc.) */
  item: T;

  /** React Hook Form's controlled field props (onChange, onBlur, value, ref) */
  field: ControllerRenderProps<FieldValues, string>;

  /** React Hook Form's field state (invalid, error, isTouched, isDirty) */
  fieldState: ControllerFieldState;
}

import { ControllerFieldState, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { BaseFormItem, FormSchema } from './core';

export interface RNGInputProps<S extends FormSchema, T extends BaseFormItem<S>> {
  item: T;
  field: ControllerRenderProps<FieldValues, string>;
  fieldState: ControllerFieldState;
}

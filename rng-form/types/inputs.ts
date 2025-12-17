import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './core';
import { InputFieldRegistry } from './field-registry';

/**
 * Mapped Type to generate all Input Items.
 */
export type InputItem<S extends FormSchema> = {
  [K in keyof InputFieldRegistry<S>]: BaseFormItem<S> & {
    type: K;
    name: Path<z.infer<S>>;
  } & InputFieldRegistry<S>[K];
}[keyof InputFieldRegistry<S>];

export type { AutocompleteOption, RadioOption } from './field-registry';

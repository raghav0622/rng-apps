import { FormSchema } from './core';
import { InputItem } from './inputs';
import { LayoutItem } from './layouts';

export * from './component-props';
export * from './core';
export * from './field-registry';
export * from './inputs';
export * from './layouts';

/**
 * The Master Type Union.
 * Used everywhere in the app.
 */
export type FormItem<S extends FormSchema> = InputItem<S> | LayoutItem<S>;

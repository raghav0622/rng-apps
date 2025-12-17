import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './types/core';
import { InputFieldRegistry, LayoutRegistry } from './types/field-registry';
import { FormItem } from './types/index';

/**
 * A Type-Safe Builder Class.
 */
export class FormBuilderDSL<S extends FormSchema> {
  // ===========================================================================
  // INTERNAL FACTORY
  // ===========================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private create<T extends string, P>(type: T, name: Path<z.infer<S>> | undefined, props: P): any {
    return { type, name, ...props };
  }

  // ===========================================================================
  // GENERIC FIELD BUILDER
  // ===========================================================================

  field<K extends keyof InputFieldRegistry<S>>(
    type: K,
    name: Path<z.infer<S>>,
    props?: Omit<InputFieldRegistry<S>[K], 'type'> & Partial<BaseFormItem<S>>,
  ): FormItem<S> {
    return this.create(type, name, props || {});
  }

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================

  text(name: Path<z.infer<S>>, props?: InputFieldRegistry<S>['text'] & Partial<BaseFormItem<S>>) {
    return this.field('text', name, props);
  }

  password(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['password'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('password', name, props);
  }

  number(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['number'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('number', name, props);
  }

  switch(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['switch'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('switch', name, props);
  }

  date(name: Path<z.infer<S>>, props?: InputFieldRegistry<S>['date'] & Partial<BaseFormItem<S>>) {
    return this.field('date', name, props);
  }

  masked(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['masked-text'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('masked-text', name, props);
  }

  calculated(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['calculated'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('calculated', name, props);
  }

  radio(name: Path<z.infer<S>>, props: InputFieldRegistry<S>['radio'] & Partial<BaseFormItem<S>>) {
    return this.field('radio', name, props);
  }

  checkbox(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['checkbox-group'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('checkbox-group', name, props);
  }

  autocomplete(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['autocomplete'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('autocomplete', name, props);
  }

  asyncAutocomplete(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['async-autocomplete'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('async-autocomplete', name, props);
  }

  file(name: Path<z.infer<S>>, props?: InputFieldRegistry<S>['file'] & Partial<BaseFormItem<S>>) {
    return this.field('file', name, props);
  }

  richText(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['rich-text'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('rich-text', name, props);
  }

  // ===========================================================================
  // LAYOUTS
  // ===========================================================================

  // NOTE: For layouts, we pass 'any' to LayoutRegistry lookup in the DSL signature
  // to avoid complex generic constraints, or simply rely on the method parameters
  // to implicitly match the shape.

  section(title: string, children: FormItem<S>[], props?: Partial<BaseFormItem<S>>) {
    return this.create('section', undefined, { title, children, ...props });
  }

  tabs(tabs: LayoutRegistry<S, FormItem<S>>['tabs']['tabs'], props?: Partial<BaseFormItem<S>>) {
    return this.create('tabs', undefined, { tabs, ...props });
  }

  wizard(
    steps: LayoutRegistry<S, FormItem<S>>['wizard']['steps'],
    props?: Partial<BaseFormItem<S>>,
  ) {
    return this.create('wizard', undefined, { steps, ...props });
  }

  array(
    name: Path<z.infer<S>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: FormItem<any>[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Omit<LayoutRegistry<S, any>['array'], 'items' | 'name'> & Partial<BaseFormItem<S>>,
  ) {
    return this.create('array', name, { items, ...props });
  }

  dataGrid(
    name: Path<z.infer<S>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: LayoutRegistry<S, any>['data-grid']['columns'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Omit<LayoutRegistry<S, any>['data-grid'], 'columns' | 'name'> &
      Partial<BaseFormItem<S>>,
  ) {
    return this.create('data-grid', name, { columns, ...props });
  }
}

export function defineForm<S extends FormSchema>(
  builderFn: (f: FormBuilderDSL<S>) => FormItem<S>[],
): FormItem<S>[] {
  const builder = new FormBuilderDSL<S>();
  return builderFn(builder);
}

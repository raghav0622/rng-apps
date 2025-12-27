import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './types/core';
import { InputFieldRegistry, LayoutRegistry } from './types/field-registry';
import { FormItem } from './types/index';

/**
 * A Type-Safe Builder Class.
 * Provides convenience methods for all registered field types.
 */
export class FormBuilderDSL<S extends FormSchema> {
  private fields: Record<string, z.ZodTypeAny> = {};

  buildZodSchema() {
    return z.object(this.fields);
  }

  // ===========================================================================
  // INTERNAL FACTORY
  // ===========================================================================

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
  // PRIMITIVES
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

  hidden(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['hidden'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('hidden', name, props);
  }

  color(name: Path<z.infer<S>>, props?: InputFieldRegistry<S>['color'] & Partial<BaseFormItem<S>>) {
    return this.field('color', name, props);
  }

  date(name: Path<z.infer<S>>, props?: InputFieldRegistry<S>['date'] & Partial<BaseFormItem<S>>) {
    return this.field('date', name, props);
  }

  // ===========================================================================
  // EXTENDED TEXT
  // ===========================================================================

  masked(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['masked-text'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('masked-text', name, props);
  }

  otp(name: Path<z.infer<S>>, props: InputFieldRegistry<S>['otp'] & Partial<BaseFormItem<S>>) {
    return this.field('otp', name, props);
  }

  calculated(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['calculated'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('calculated', name, props);
  }

  richText(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['rich-text'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('rich-text', name, props);
  }

  // ===========================================================================
  // SELECTION & CHOICE
  // ===========================================================================

  switch(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['switch'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('switch', name, props);
  }

  radio(
    name: Path<z.infer<S>>,
    options: InputFieldRegistry<S>['radio']['options'],
    props?: Omit<InputFieldRegistry<S>['radio'], 'options'> & Partial<BaseFormItem<S>>,
  ) {
    return this.field('radio', name, { options, ...props });
  }

  checkbox(
    name: Path<z.infer<S>>,
    options: InputFieldRegistry<S>['checkbox-group']['options'],
    props?: Omit<InputFieldRegistry<S>['checkbox-group'], 'options'> & Partial<BaseFormItem<S>>,
  ) {
    return this.field('checkbox-group', name, { options, ...props });
  }

  toggleGroup(
    name: Path<z.infer<S>>,
    options: InputFieldRegistry<S>['toggle-group']['options'],
    props?: Omit<InputFieldRegistry<S>['toggle-group'], 'options'> & Partial<BaseFormItem<S>>,
  ) {
    return this.field('toggle-group', name, { options, ...props });
  }

  select(
    name: Path<z.infer<S>>,
    options: InputFieldRegistry<S>['select']['options'],
    props?: Omit<InputFieldRegistry<S>['select'], 'options'> & Partial<BaseFormItem<S>>,
  ) {
    return this.field('select', name, { options, ...props });
  }

  slider(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['slider'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('slider', name, props);
  }

  rating(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['rating'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('rating', name, props);
  }

  transferList(
    name: Path<z.infer<S>>,
    options: InputFieldRegistry<S>['transfer-list']['options'],
    props?: Omit<InputFieldRegistry<S>['transfer-list'], 'options'> & Partial<BaseFormItem<S>>,
  ) {
    return this.field('transfer-list', name, { options, ...props });
  }

  autocomplete(
    name: Path<z.infer<S>>,
    options: InputFieldRegistry<S>['autocomplete']['options'],
    props?: Omit<InputFieldRegistry<S>['autocomplete'], 'options'> & Partial<BaseFormItem<S>>,
  ) {
    return this.field('autocomplete', name, { options, ...props });
  }

  asyncAutocomplete(
    name: Path<z.infer<S>>,
    props: InputFieldRegistry<S>['async-autocomplete'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('async-autocomplete', name, props);
  }

  // ===========================================================================
  // ADVANCED & MEDIA
  // ===========================================================================

  file(name: Path<z.infer<S>>, props?: InputFieldRegistry<S>['file'] & Partial<BaseFormItem<S>>) {
    return this.field('file', name, props);
  }

  avatar(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['avatar'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('avatar', name, props);
  }

  multiImageEditor(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['multi-image-editor'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('multi-image-editor', name, props);
  }

  signature(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['signature'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('signature', name, props);
  }

  dateRange(
    name: Path<z.infer<S>>,
    props?: InputFieldRegistry<S>['date-range'] & Partial<BaseFormItem<S>>,
  ) {
    return this.field('date-range', name, props);
  }

  // ===========================================================================
  // LAYOUTS
  // ===========================================================================

  section(title: string, children: FormItem<S>[], props?: Partial<BaseFormItem<S>>) {
    return this.create('section', undefined, { title, children, ...props });
  }

  tabs(tabs: LayoutRegistry<S, FormItem<S>>['tabs']['tabs'], props?: Partial<BaseFormItem<S>>) {
    return this.create('tabs', undefined, { tabs, ...props });
  }

  accordion(
    items: LayoutRegistry<S, FormItem<S>>['accordion']['items'],
    props?: Partial<BaseFormItem<S>>,
  ) {
    return this.create('accordion', undefined, { items, ...props });
  }

  wizard(
    steps: LayoutRegistry<S, FormItem<S>>['wizard']['steps'],
    props?: Partial<BaseFormItem<S>>,
  ) {
    return this.create('wizard', undefined, { steps, ...props });
  }

  stepper(
    activeStepIndex: number,
    steps: LayoutRegistry<S, FormItem<S>>['stepper']['steps'],
    props?: Partial<BaseFormItem<S>>,
  ) {
    return this.create('stepper', undefined, { activeStepIndex, steps, ...props });
  }

  modal(
    triggerLabel: string,
    children: FormItem<S>[],
    props?: Omit<LayoutRegistry<S, FormItem<S>>['modal-form'], 'triggerLabel' | 'children'> &
      Partial<BaseFormItem<S>>,
  ) {
    return this.create('modal-form', undefined, { triggerLabel, children, ...props });
  }

  // Data Iterators

  array(
    name: Path<z.infer<S>>,

    items: FormItem<any>[],

    props?: Omit<LayoutRegistry<S, any>['array'], 'items' | 'name'> & Partial<BaseFormItem<S>>,
  ) {
    return this.create('array', name, { items, ...props });
  }

  dataGrid(
    name: Path<z.infer<S>>,

    columns: LayoutRegistry<S, any>['data-grid']['columns'],

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

import { Path } from 'react-hook-form';
import { z } from 'zod';
import * as T from './types';

/**
 * A Type-Safe Builder Class to generate FormItems.
 * Uses a generic factory method to enforce DRY principles.
 */
export class FormBuilderDSL<S extends T.FormSchema> {
  /**
   * Internal factory to generate the field object.
   * Keeps implementation DRY while public methods enforce strict typing.
   */
  private create<Item extends T.BaseFormItem<S>>(
    type: Item['type'],
    name?: Path<z.infer<S>>,
    props?: Omit<Item, 'type' | 'name'>,
  ): Item {
    return { type, name, ...props } as Item;
  }

  // ===========================================================================
  // BASIC INPUTS
  // ===========================================================================

  text(name: Path<z.infer<S>>, props?: Omit<T.TextFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.TextFieldItem<S>>('text', name, props);
  }

  password(name: Path<z.infer<S>>, props?: Omit<T.TextFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.TextFieldItem<S>>('password', name, props);
  }

  number(name: Path<z.infer<S>>, props?: Omit<T.NumberFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.NumberFieldItem<S>>('number', name, props);
  }

  currency(name: Path<z.infer<S>>, props?: Omit<T.NumberFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.NumberFieldItem<S>>('currency', name, props);
  }

  hidden(name: Path<z.infer<S>>, props?: Omit<T.HiddenFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.HiddenFieldItem<S>>('hidden', name, props);
  }

  color(name: Path<z.infer<S>>, props?: Omit<T.ColorItem<S>, 'type' | 'name'>) {
    return this.create<T.ColorItem<S>>('color', name, props);
  }

  switch(name: Path<z.infer<S>>, props?: Omit<T.SwitchFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.SwitchFieldItem<S>>('switch', name, props);
  }

  date(name: Path<z.infer<S>>, props?: Omit<T.DateFieldItem<S>, 'type' | 'name'>) {
    return this.create<T.DateFieldItem<S>>('date', name, props);
  }

  dateRange(name: Path<z.infer<S>>, props?: Omit<T.DateRangeItem<S>, 'type' | 'name'>) {
    return this.create<T.DateRangeItem<S>>('date-range', name, props);
  }

  // ===========================================================================
  // ADVANCED & SPECIALIZED INPUTS
  // ===========================================================================

  masked(
    name: Path<z.infer<S>>,
    mask: string,
    props?: Omit<T.MaskedTextItem<S>, 'type' | 'name' | 'mask'>,
  ) {
    return this.create<T.MaskedTextItem<S>>('masked-text', name, { mask, ...props });
  }

  calculated(
    name: Path<z.infer<S>>,
    calculate: (values: z.infer<S>) => string | number,
    props?: Omit<T.CalculatedItem<S>, 'type' | 'name' | 'calculate'>,
  ) {
    return this.create<T.CalculatedItem<S>>('calculated', name, { calculate, ...props });
  }

  richText(name: Path<z.infer<S>>, props?: Omit<T.RichTextItem<S>, 'type' | 'name'>) {
    return this.create<T.RichTextItem<S>>('rich-text', name, props);
  }

  file(name: Path<z.infer<S>>, props?: Omit<T.FileItem<S>, 'type' | 'name'>) {
    return this.create<T.FileItem<S>>('file', name, props);
  }

  slider(name: Path<z.infer<S>>, props?: Omit<T.SliderItem<S>, 'type' | 'name'>) {
    return this.create<T.SliderItem<S>>('slider', name, props);
  }

  rating(name: Path<z.infer<S>>, props?: Omit<T.RatingItem<S>, 'type' | 'name'>) {
    return this.create<T.RatingItem<S>>('rating', name, props);
  }

  signature(name: Path<z.infer<S>>, props?: Omit<T.SignatureItem<S>, 'type' | 'name'>) {
    return this.create<T.SignatureItem<S>>('signature', name, props);
  }

  location(name: Path<z.infer<S>>, props?: Omit<T.LocationItem<S>, 'type' | 'name'>) {
    return this.create<T.LocationItem<S>>('location', name, props);
  }

  // ===========================================================================
  // SELECTION INPUTS
  // ===========================================================================

  radio(
    name: Path<z.infer<S>>,
    options: T.RadioGroupItem<S>['options'],
    props?: Omit<T.RadioGroupItem<S>, 'type' | 'name' | 'options'>,
  ) {
    return this.create<T.RadioGroupItem<S>>('radio', name, { options, ...props });
  }

  checkbox(
    name: Path<z.infer<S>>,
    options: T.CheckboxGroupItem<S>['options'],
    props?: Omit<T.CheckboxGroupItem<S>, 'type' | 'name' | 'options'>,
  ) {
    return this.create<T.CheckboxGroupItem<S>>('checkbox-group', name, { options, ...props });
  }

  transferList(
    name: Path<z.infer<S>>,
    options: T.TransferListItem<S>['options'],
    props?: Omit<T.TransferListItem<S>, 'type' | 'name' | 'options'>,
  ) {
    return this.create<T.TransferListItem<S>>('transfer-list', name, { options, ...props });
  }

  autocomplete(
    name: Path<z.infer<S>>,
    options: T.AutocompleteItem<S>['options'],
    props?: Omit<T.AutocompleteItem<S>, 'type' | 'name' | 'options'>,
  ) {
    return this.create<T.AutocompleteItem<S>>('autocomplete', name, { options, ...props });
  }

  asyncAutocomplete(
    name: Path<z.infer<S>>,
    loadOptions: T.AsyncAutocompleteItem<S>['loadOptions'],
    props?: Omit<T.AsyncAutocompleteItem<S>, 'type' | 'name' | 'loadOptions'>,
  ) {
    return this.create<T.AsyncAutocompleteItem<S>>('async-autocomplete', name, {
      loadOptions,
      ...props,
    });
  }

  // ===========================================================================
  // LAYOUTS & CONTAINERS
  // ===========================================================================

  section(
    title: string,
    children: T.FormItem<S>[],
    props?: Omit<T.SectionItem<S>, 'type' | 'title' | 'children'>,
  ) {
    return this.create<T.SectionItem<S>>('section', undefined, { title, children, ...props });
  }

  tabs(tabs: T.TabsItem<S>['tabs'], props?: Omit<T.TabsItem<S>, 'type' | 'tabs'>) {
    return this.create<T.TabsItem<S>>('tabs', undefined, { tabs, ...props });
  }

  accordion(
    items: T.AccordionItem<S>['items'],
    props?: Omit<T.AccordionItem<S>, 'type' | 'items'>,
  ) {
    return this.create<T.AccordionItem<S>>('accordion', undefined, { items, ...props });
  }

  wizard(steps: T.WizardItem<S>['steps'], props?: Omit<T.WizardItem<S>, 'type' | 'steps'>) {
    return this.create<T.WizardItem<S>>('wizard', undefined, { steps, ...props });
  }

  array(
    name: Path<z.infer<S>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: T.FormItem<any>[],
    props?: Omit<T.ArrayItem<S>, 'type' | 'name' | 'items'>,
  ) {
    return this.create<T.ArrayItem<S>>('array', name, { items, ...props });
  }
}

/**
 * Helper function to define form schema with type safety.
 */
export function defineForm<S extends T.FormSchema>(
  builderFn: (f: FormBuilderDSL<S>) => T.FormItem<S>[],
): T.FormItem<S>[] {
  const builder = new FormBuilderDSL<S>();
  return builderFn(builder);
}

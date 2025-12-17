import { Path } from 'react-hook-form';
import { z } from 'zod';
import {
  AccordionItem,
  ArrayItem,
  AsyncAutocompleteItem,
  AutocompleteItem,
  CalculatedItem,
  CheckboxGroupItem,
  DateFieldItem,
  FileItem,
  FormItem,
  FormSchema,
  HiddenFieldItem,
  MaskedTextItem,
  NumberFieldItem,
  RadioGroupItem,
  RatingItem,
  RichTextItem,
  SectionItem,
  SliderItem,
  SwitchFieldItem,
  TabsItem,
  TextFieldItem,
  WizardItem,
} from './types';

/**
 * A Type-Safe Builder Class to generate FormItems.
 */
export class FormBuilderDSL<S extends FormSchema> {
  // ===========================================================================
  // BASIC INPUTS
  // ===========================================================================

  text(name: Path<z.infer<S>>, props?: Omit<TextFieldItem<S>, 'type' | 'name'>): TextFieldItem<S> {
    return { type: 'text', name, ...props };
  }

  password(
    name: Path<z.infer<S>>,
    props?: Omit<TextFieldItem<S>, 'type' | 'name'>,
  ): TextFieldItem<S> {
    return { type: 'password', name, ...props };
  }

  number(
    name: Path<z.infer<S>>,
    props?: Omit<NumberFieldItem<S>, 'type' | 'name'>,
  ): NumberFieldItem<S> {
    return { type: 'number', name, ...props };
  }

  currency(
    name: Path<z.infer<S>>,
    props?: Omit<NumberFieldItem<S>, 'type' | 'name'>,
  ): NumberFieldItem<S> {
    return { type: 'currency', name, ...props };
  }

  switch(
    name: Path<z.infer<S>>,
    props?: Omit<SwitchFieldItem<S>, 'type' | 'name'>,
  ): SwitchFieldItem<S> {
    return { type: 'switch', name, ...props };
  }

  date(name: Path<z.infer<S>>, props?: Omit<DateFieldItem<S>, 'type' | 'name'>): DateFieldItem<S> {
    return { type: 'date', name, ...props };
  }

  hidden(
    name: Path<z.infer<S>>,
    props?: Omit<HiddenFieldItem<S>, 'type' | 'name'>,
  ): HiddenFieldItem<S> {
    return { type: 'hidden', name, ...props };
  }

  // ===========================================================================
  // ADVANCED & SPECIALIZED INPUTS
  // ===========================================================================

  masked(
    name: Path<z.infer<S>>,
    mask: string,
    props?: Omit<MaskedTextItem<S>, 'type' | 'name' | 'mask'>,
  ): MaskedTextItem<S> {
    return { type: 'masked-text', name, mask, ...props };
  }

  calculated(
    name: Path<z.infer<S>>,
    calculate: (values: z.infer<S>) => string | number,
    props?: Omit<CalculatedItem<S>, 'type' | 'name' | 'calculate'>,
  ): CalculatedItem<S> {
    return { type: 'calculated', name, calculate, ...props };
  }

  richText(
    name: Path<z.infer<S>>,
    props?: Omit<RichTextItem<S>, 'type' | 'name'>,
  ): RichTextItem<S> {
    return { type: 'rich-text', name, ...props };
  }

  file(name: Path<z.infer<S>>, props?: Omit<FileItem<S>, 'type' | 'name'>): FileItem<S> {
    return { type: 'file', name, ...props };
  }

  slider(name: Path<z.infer<S>>, props?: Omit<SliderItem<S>, 'type' | 'name'>): SliderItem<S> {
    return { type: 'slider', name, ...props };
  }

  rating(name: Path<z.infer<S>>, props?: Omit<RatingItem<S>, 'type' | 'name'>): RatingItem<S> {
    return { type: 'rating', name, ...props };
  }

  // ===========================================================================
  // SELECTION INPUTS
  // ===========================================================================

  radio(
    name: Path<z.infer<S>>,
    options: RadioGroupItem<S>['options'],
    props?: Omit<RadioGroupItem<S>, 'type' | 'name' | 'options'>,
  ): RadioGroupItem<S> {
    return { type: 'radio', name, options, ...props };
  }

  checkbox(
    name: Path<z.infer<S>>,
    options: CheckboxGroupItem<S>['options'],
    props?: Omit<CheckboxGroupItem<S>, 'type' | 'name' | 'options'>,
  ): CheckboxGroupItem<S> {
    return { type: 'checkbox-group', name, options, ...props };
  }

  autocomplete(
    name: Path<z.infer<S>>,
    options: AutocompleteItem<S>['options'],
    props?: Omit<AutocompleteItem<S>, 'type' | 'name' | 'options'>,
  ): AutocompleteItem<S> {
    return { type: 'autocomplete', name, options, ...props };
  }

  asyncAutocomplete(
    name: Path<z.infer<S>>,
    loadOptions: AsyncAutocompleteItem<S>['loadOptions'],
    props?: Omit<AsyncAutocompleteItem<S>, 'type' | 'name' | 'loadOptions'>,
  ): AsyncAutocompleteItem<S> {
    return { type: 'async-autocomplete', name, loadOptions, ...props };
  }

  // ===========================================================================
  // LAYOUTS & CONTAINERS
  // ===========================================================================

  section(
    title: string,
    children: FormItem<S>[],
    props?: Omit<SectionItem<S>, 'type' | 'title' | 'children'>,
  ): SectionItem<S> {
    return { type: 'section', title, children, ...props };
  }

  tabs(tabs: TabsItem<S>['tabs'], props?: Omit<TabsItem<S>, 'type' | 'tabs'>): TabsItem<S> {
    return { type: 'tabs', tabs, ...props };
  }

  accordion(
    items: AccordionItem<S>['items'],
    props?: Omit<AccordionItem<S>, 'type' | 'items'>,
  ): AccordionItem<S> {
    return { type: 'accordion', items, ...props };
  }

  wizard(
    steps: WizardItem<S>['steps'],
    props?: Omit<WizardItem<S>, 'type' | 'steps'>,
  ): WizardItem<S> {
    return { type: 'wizard', steps, ...props };
  }

  array(
    name: Path<z.infer<S>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: FormItem<any>[],
    props?: Omit<ArrayItem<S>, 'type' | 'name' | 'items'>,
  ): ArrayItem<S> {
    return { type: 'array', name, items, ...props };
  }
}

/**
 * Helper function to define form schema with type safety.
 */
export function defineForm<S extends FormSchema>(
  builderFn: (f: FormBuilderDSL<S>) => FormItem<S>[],
): FormItem<S>[] {
  const builder = new FormBuilderDSL<S>();
  return builderFn(builder);
}

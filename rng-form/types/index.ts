import { FormSchema } from './core';
import {
  AsyncAutocompleteItem,
  AutocompleteItem,
  CalculatedItem,
  CheckboxGroupItem,
  ColorItem,
  DateFieldItem,
  DateRangeItem,
  FileItem,
  HiddenFieldItem,
  LocationItem,
  MaskedTextItem,
  NumberFieldItem,
  OtpItem,
  RadioGroupItem,
  RatingItem,
  RichTextItem,
  SignatureItem,
  SliderItem,
  SwitchFieldItem,
  TextFieldItem,
  ToggleGroupItem,
  TransferListItem,
} from './inputs';
import {
  AccordionItem,
  ArrayItem,
  DataGridItem,
  ModalFormItem,
  SectionItem,
  StepperItem,
  TabsItem,
  WizardItem,
} from './layouts';

export * from './core';
export * from './inputs';
export * from './layouts';

export type FormItem<S extends FormSchema> =
  | TextFieldItem<S>
  | NumberFieldItem<S>
  | DateFieldItem<S>
  | HiddenFieldItem<S>
  | MaskedTextItem<S>
  | CalculatedItem<S>
  | ColorItem<S>
  | OtpItem<S>
  | SwitchFieldItem<S>
  | SliderItem<S>
  | RatingItem<S>
  | RadioGroupItem<S>
  | CheckboxGroupItem<S>
  | ToggleGroupItem<S>
  | TransferListItem<S>
  | AutocompleteItem<S>
  | AsyncAutocompleteItem<S>
  | FileItem<S>
  | RichTextItem<S>
  | SignatureItem<S>
  | LocationItem<S>
  | DateRangeItem<S>
  | SectionItem<S>
  | TabsItem<S>
  | AccordionItem<S>
  | WizardItem<S>
  | StepperItem<S>
  | ModalFormItem<S>
  | ArrayItem<S>
  | DataGridItem<S>;

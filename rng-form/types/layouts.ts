import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './core';
import { FormItem } from './index';

export type SectionItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'section';
  title?: string;
  children: FormItem<S>[];
};

export type TabsItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'tabs';
  tabs: {
    label: string;
    children: FormItem<S>[];
  }[];
};

export type AccordionItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'accordion';
  items: {
    title: string;
    defaultExpanded?: boolean;
    children: FormItem<S>[];
  }[];
};

export type WizardItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'wizard';
  steps: {
    label: string;
    description?: string;
    children: FormItem<S>[];
  }[];
};

export type StepperItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'stepper';
  activeStepIndex?: number;
  steps: {
    label: string;
    description?: string;
  }[];
};

export type ModalFormItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'modal-form';
  triggerLabel: string;
  dialogTitle?: string;
  children: FormItem<S>[];
};

export type ArrayItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'array';
  name: Path<z.infer<S>>;
  itemLabel?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: FormItem<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
};

export type DataGridItem<S extends FormSchema> = BaseFormItem<S> & {
  type: 'data-grid';
  name: Path<z.infer<S>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: { header: string; field: FormItem<any>; width?: number | string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
};

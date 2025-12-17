/* eslint-disable @typescript-eslint/no-explicit-any */
import { Path } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './core';
import { LayoutRegistry } from './field-registry';
import { FormItem } from './index';

/**
 * Helper to get props from registry WITHOUT triggering circular deps.
 * We pass 'any' as the ItemType because we will manually redefine children/items below.
 */

type SafeLayoutProps<S extends FormSchema, K extends keyof LayoutRegistry<S>> = LayoutRegistry<
  S,
  any
>[K];

// =============================================================================
// RECURSIVE LAYOUT INTERFACES
// =============================================================================

export interface SectionItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'section'>, 'children'> {
  type: 'section';
  children: FormItem<S>[];
}

export interface TabsItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'tabs'>, 'tabs'> {
  type: 'tabs';
  tabs: {
    label: string;
    children: FormItem<S>[];
  }[];
}

export interface AccordionItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'accordion'>, 'items'> {
  type: 'accordion';
  items: {
    title: string;
    defaultExpanded?: boolean;
    children: FormItem<S>[];
  }[];
}

export interface WizardItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'wizard'>, 'steps'> {
  type: 'wizard';
  steps: {
    label: string;
    description?: string;
    children: FormItem<S>[];
  }[];
}

export interface StepperItem<S extends FormSchema>
  extends BaseFormItem<S>, SafeLayoutProps<S, 'stepper'> {
  type: 'stepper';
  // Stepper doesn't have recursive children in its props (it just tracks state),
  // but if it did, we'd handle it like above.
}

export interface ModalFormItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'modal-form'>, 'children'> {
  type: 'modal-form';
  children: FormItem<S>[];
}

export interface ArrayItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'array'>, 'items' | 'name'> {
  type: 'array';
  name: Path<z.infer<S>>;
  items: FormItem<any>[]; // Array items often need 'any' schema context or a sub-schema
}

export interface DataGridItem<S extends FormSchema>
  extends BaseFormItem<S>, Omit<SafeLayoutProps<S, 'data-grid'>, 'columns' | 'name'> {
  type: 'data-grid';
  name: Path<z.infer<S>>;
  columns: {
    header: string;
    field: FormItem<any>;
    width?: number | string;
  }[];
}

/**
 * Union of all Layout Items
 */
export type LayoutItem<S extends FormSchema> =
  | SectionItem<S>
  | TabsItem<S>
  | AccordionItem<S>
  | WizardItem<S>
  | StepperItem<S>
  | ModalFormItem<S>
  | ArrayItem<S>
  | DataGridItem<S>;

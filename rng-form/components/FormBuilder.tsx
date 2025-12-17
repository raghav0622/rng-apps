/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { logError } from '@/lib/logger';
import { Grid } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { INPUT_REGISTRY } from '../registry';
import { FormItem, FormSchema, LayoutType } from '../types';
import { RNGArrayField } from './ArrayField';
import { RNGDataGrid } from './DataGrid';
import {
  RNGAccordionLayout,
  RNGModalLayout,
  RNGSectionLayout,
  RNGStepperLayout,
  RNGTabsLayout,
  RNGWizardLayout,
} from './layouts';

// Define Layout mapping locally to centralize logic without circular registry imports
const LAYOUT_REGISTRY: Record<LayoutType, React.ComponentType<any>> = {
  section: RNGSectionLayout,
  tabs: RNGTabsLayout,
  accordion: RNGAccordionLayout,
  wizard: RNGWizardLayout,
  stepper: RNGStepperLayout,
  'modal-form': RNGModalLayout,
  array: RNGArrayField,
  'data-grid': RNGDataGrid,
};

interface FormBuilderProps<S extends FormSchema> {
  uiSchema: FormItem<S>[];
  pathPrefix?: string;
}

export function FormBuilder<S extends FormSchema>({ uiSchema, pathPrefix }: FormBuilderProps<S>) {
  const { register } = useFormContext();

  if (!uiSchema || uiSchema.length === 0) return null;

  return (
    <Grid container spacing={2}>
      {uiSchema.map((item, index) => {
        // Handle name scoping for nested structures
        const scopedName = pathPrefix && item.name ? `${pathPrefix}.${item.name}` : item.name;
        const scopedItem = { ...item, name: scopedName };
        const key = scopedName || `${item.type}-${index}`;

        // 1. Hidden Fields - Efficient render without component overhead
        if (item.type === 'hidden') {
          return <input type="hidden" key={key} {...register(scopedName as any)} />;
        }

        // 2. Unified Component Lookup
        // We cast to 'any' for the lookup key because item.type is a union of InputType | LayoutType
        const Component = (LAYOUT_REGISTRY as any)[item.type] || (INPUT_REGISTRY as any)[item.type];

        if (Component) {
          // We pass 'scopedItem' as 'item'.
          // Typescript cannot verify at this level that the specific item subtype matches the Component props,
          // so we cast to 'any' to allow the render. The Component itself asserts strict types internally.
          return <Component key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;
        }

        logError(`No component found for type: ${item.type}`);
        return null;
      })}
    </Grid>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { logError } from '@/lib/logger';
import { Grid } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { INPUT_REGISTRY } from '../registry';
import { FormItem, FormSchema } from '../types';
import { RNGAccordionLayout, RNGSectionLayout, RNGTabsLayout, RNGWizardLayout } from './layouts';

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
        const scopedName = pathPrefix && item.name ? `${pathPrefix}.${item.name}` : item.name;
        // Clone item to inject scoped name without mutating original
        const scopedItem = { ...item, name: scopedName };
        const key = scopedName || `${item.type}-${index}`;

        // 1. Layouts (Specific components that recursively call FormBuilder)
        // These are handled explicitly here to prevent circular dependency issues in registry imports
        switch (item.type) {
          case 'section':
            return <RNGSectionLayout key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;
          case 'tabs':
            return <RNGTabsLayout key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;
          case 'accordion':
            return (
              <RNGAccordionLayout key={key} item={scopedItem as any} pathPrefix={pathPrefix} />
            );
          case 'wizard':
            return <RNGWizardLayout key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;
        }

        // 2. Hidden Fields
        if (item.type === 'hidden') {
          return <input type="hidden" key={key} {...register(scopedName as any)} />;
        }

        // 3. Registry Items (Standard Inputs)
        const Component = INPUT_REGISTRY[item.type];
        if (Component) {
          return <Component key={key} item={scopedItem} />;
        }

        logError(`No component found for type: ${item.type}`);
        return null;
      })}
    </Grid>
  );
}

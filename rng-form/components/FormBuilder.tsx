/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { logError } from '@/lib/logger';
import { Divider, Grid, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { INPUT_REGISTRY } from '../registry';
import { FormItem, FormSchema } from '../types';
import { RNGAccordionLayout, RNGTabsLayout } from './Layouts';
import { RNGWizard } from './Wizard';

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

        // 1. Containers & Layouts
        if (item.type === 'section') {
          return (
            <Grid key={key} size={12} sx={{ mt: 2, mb: 1 }}>
              {item.title && (
                <>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}
              {/* Recursive Call for Children */}
              <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
            </Grid>
          );
        }

        if (item.type === 'tabs')
          return <RNGTabsLayout key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;
        if (item.type === 'accordion')
          return <RNGAccordionLayout key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;
        if (item.type === 'wizard')
          return <RNGWizard key={key} item={scopedItem as any} pathPrefix={pathPrefix} />;

        // 2. Hidden Fields
        if (item.type === 'hidden') {
          return <input type="hidden" key={key} {...register(scopedName as any)} />;
        }

        // 3. Registry Items (Inputs)
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

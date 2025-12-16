/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
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

  return (
    <>
      {uiSchema.map((item, index) => {
        const scopedName = pathPrefix && item.name ? `${pathPrefix}.${item.name}` : item.name;
        // Clone item to inject scoped name without mutating original
        const scopedItem = { ...item, name: scopedName };

        // 1. Containers
        if (item.type === 'section') {
          return (
            <Grid key={index} size={12} sx={{ mt: 2, mb: 1 }}>
              {item.title && (
                <>
                  <Typography variant="h6" color="primary">
                    {item.title}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}
              <Grid container spacing={2}>
                <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
              </Grid>
            </Grid>
          );
        }

        if (item.type === 'tabs')
          return <RNGTabsLayout key={index} item={scopedItem as any} pathPrefix={pathPrefix} />;
        if (item.type === 'accordion')
          return (
            <RNGAccordionLayout key={index} item={scopedItem as any} pathPrefix={pathPrefix} />
          );
        if (item.type === 'wizard')
          return <RNGWizard key={index} item={scopedItem as any} pathPrefix={pathPrefix} />;

        // 2. Hidden
        if (item.type === 'hidden') {
          return <input type="hidden" key={scopedName} {...register(scopedName as any)} />;
        }

        // 3. Registry Items
        const Component = INPUT_REGISTRY[item.type];
        if (Component) {
          return <Component key={scopedName || index} item={scopedItem} />;
        }

        return null;
      })}
    </>
  );
}

'use client';

import { Grid, GridProps } from '@mui/material';
import { FormItem, FormSchema } from '../types';
import { FormItemGrid } from './FormItemGrid';

interface FormBuilderProps<S extends FormSchema> {
  uiSchema: FormItem<S>[];
  pathPrefix?: string;
  gridProps?: Partial<GridProps>;
}

export function FormBuilder<S extends FormSchema>({
  uiSchema,
  pathPrefix,
  gridProps,
}: FormBuilderProps<S>) {
  if (!uiSchema || uiSchema.length === 0) return null;

  return (
    <Grid container spacing={2} {...gridProps}>
      {uiSchema.map((item, index) => {
        // Logic: Try to find a stable ID.
        // 1. item.id (explicitly set by dev)
        // 2. item.name (schema path)
        // 3. Fallback to index (unstable if array reorders)

        let uniqueKey = `${index}`;
        if (item.id) {
          uniqueKey = item.id;
        } else if (item.name) {
          uniqueKey = item.name;
        }

        const fullKey = pathPrefix ? `${pathPrefix}-${uniqueKey}` : uniqueKey;

        return <FormItemGrid key={fullKey} item={item} pathPrefix={pathPrefix} />;
      })}
    </Grid>
  );
}

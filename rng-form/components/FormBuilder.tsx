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
    // FIX: Removed width: '100%' to prevent horizontal scrollbars caused by negative margins
    <Grid container spacing={2} {...gridProps}>
      {uiSchema.map((item, index) => {
        // Create a stable key. Prefer name, fallback to type-index.
        const key = item.name
          ? pathPrefix
            ? `${pathPrefix}.${item.name}`
            : item.name
          : `${item.type}-${index}`;

        return <FormItemGrid key={key} item={item} pathPrefix={pathPrefix} />;
      })}
    </Grid>
  );
}

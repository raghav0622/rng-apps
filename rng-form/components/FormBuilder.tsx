'use client';

import { Grid, GridProps } from '@mui/material';
import { FormItem, FormSchema } from '../types';
import { RenderItem } from './RenderItem';

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
    <Grid container spacing={2} sx={{ width: '100%' }} {...gridProps}>
      {uiSchema.map((item, index) => {
        const key = item.name ? `${item.name}-${index}` : `${item.type}-${index}`;
        return <RenderItem key={key} item={item} pathPrefix={pathPrefix} />;
      })}
    </Grid>
  );
}

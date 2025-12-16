'use client';
import Grid from '@mui/material/Grid';
import { FieldValues, useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from './types';

type Props<S extends FormSchema> = {
  item: BaseFormItem<S>;
  children: React.ReactNode;
};

export function FieldWrapper<S extends FormSchema>({ item, children }: Props<S>) {
  const { control } = useFormContext<FieldValues>();

  // Watch all values to determine visibility
  const values = useWatch({ control });

  // Handle Render Logic
  // Casting values to infer<S> is safe here as S matches the form structure
  if (item.renderLogic && !item.renderLogic(values as z.infer<S>)) {
    return null;
  }

  return (
    <Grid size={item.colSize?.size ?? 12} {...item.colProps}>
      {children}
    </Grid>
  );
}

'use client';
import Grid from '@mui/material/Grid';
import { useFormContext, useWatch } from 'react-hook-form';
import { BaseFormItem } from './types';

type Props = {
  item: BaseFormItem<any>;
  children: React.ReactNode;
};

export function FieldWrapper({ item, children }: Props) {
  const { control } = useFormContext();

  // Watch all values to determine visibility
  // Performance Note: For massive forms, we might optimize this,
  // but for standard forms, watching root is fine.
  const values = useWatch({ control });

  // Handle Render Logic
  if (item.renderLogic && !item.renderLogic(values)) {
    return null;
  }

  return (
    <Grid
      size={{ xs: 12, ...item.colSize }} // Default to full width
      {...item.colProps}
    >
      {children}
    </Grid>
  );
}

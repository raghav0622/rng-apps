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

  // Optimization: If dependencies are provided, only watch those.
  // Otherwise, if renderLogic exists but no deps, we must watch all (fallback).
  // If no renderLogic, we don't watch anything.
  const shouldWatch = !!item.renderLogic;

  const values = useWatch({
    control,
    name: item.dependencies || [],
    disabled: !shouldWatch,
  });

  // Handle Render Logic
  if (item.renderLogic) {
    // If we watched specific fields, 'values' is an array. If we watched global, it's an object.
    // For safety in this generic wrapper, if logic is complex, user should pass 'dependencies'.
    // Here we pass the full form state if dependencies weren't specific, or the specific values if they were.
    // Ideally, renderLogic should be pure.

    // Note: To fully support partial watches with renderLogic expecting full objects,
    // the user must strictly define dependencies.
    // For this implementation, we assume if renderLogic is present, we need data.

    // Re-fetch full data if we only watched partials but the function might need more?
    // No, we trust the user provided correct deps.

    // Safe fallback: If values is array (deps), we might not match the schema shape expected by renderLogic.
    // To keep it simple and robust for this step:
    // If deps are used, renderLogic receives an object with those keys ONLY.

    // Let's grab the *actual* current full values if we need to run logic,
    // but the component ONLY re-rendered because the watched values changed.
    const currentValues = control._formValues;
    if (!item.renderLogic(currentValues as z.infer<S>)) {
      return null;
    }
  }

  return (
    <Grid size={item.colProps?.size ?? 12} {...item.colProps}>
      {children}
    </Grid>
  );
}

'use client';

import { FIELD_CONFIG } from '@/rng-form/config';
import { useFieldLogic } from '@/rng-form/hooks/useFieldLogic';
import { BaseFormItem, FormSchema } from '@/rng-form/types';
import { AnyFieldType } from '@/rng-form/types/field-registry';
import { FormControl, FormHelperText, FormLabel, Grid } from '@mui/material';
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  useFormContext,
} from 'react-hook-form';
import { z } from 'zod';

interface FieldWrapperProps<S extends FormSchema, T extends BaseFormItem<S>> {
  item: T;
  name: Path<z.infer<S>>;
  children: (
    field: ControllerRenderProps<FieldValues, string>,
    fieldState: ControllerFieldState,
    mergedItem: T,
  ) => React.ReactNode;
}

export function FieldWrapper<S extends FormSchema, T extends BaseFormItem<S>>({
  item,
  name,
  children,
}: FieldWrapperProps<S, T>) {
  const { control } = useFormContext();
  const { isVisible, mergedItem } = useFieldLogic<S, T>(item);

  if (!isVisible) return null;

  const fieldId = `field-${(name as string).replace(/\./g, '-')}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  const config = FIELD_CONFIG[mergedItem.type as AnyFieldType] || {};
  const showExternalLabel = !config.hasInternalLabel && !!mergedItem.label;

  // Grid2 Logic:
  // Ensure 'size' is passed if it exists in colProps, or default to 12.
  // We assume mergedItem.colProps matches Grid2 props (using 'size' instead of 'xs', 'md').
  // If legacy props exist, they should be migrated or mapped manually, but here we spread.
  return (
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const enrichedField: any = {
            ...field,
            id: fieldId,
            'aria-invalid': !!fieldState.error,
            'aria-describedby': fieldState.error ? errorId : undefined,
          };

          return (
            <FormControl
              fullWidth
              error={!!fieldState.error}
              disabled={mergedItem.disabled}
              component="div"
            >
              {showExternalLabel && (
                <FormLabel htmlFor={fieldId} id={labelId} sx={{ mb: 0.5, fontWeight: 500 }}>
                  {mergedItem.label}
                </FormLabel>
              )}

              {children(enrichedField, fieldState, mergedItem)}

              {(fieldState.error?.message || mergedItem.description) && (
                <FormHelperText id={errorId}>
                  {fieldState.error?.message || mergedItem.description}
                </FormHelperText>
              )}
            </FormControl>
          );
        }}
      />
    </Grid>
  );
}

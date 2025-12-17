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

  // Logic extracted to custom hook
  // We pass the generic T through to preserve the specific 'type' literal
  const { isVisible, mergedItem } = useFieldLogic<S, T>(item);

  if (!isVisible) return null;

  // Accessibility & ID Generation

  const fieldId = `field-${(name as string).replace(/\./g, '-')}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  // Safe lookup: mergedItem.type is string, we cast to AnyFieldType for the config key
  const config = FIELD_CONFIG[mergedItem.type as AnyFieldType] || {};
  const showExternalLabel = !config.hasInternalLabel && !!mergedItem.label;

  return (
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          // Enrich field with accessibility attributes
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

              {/* Render the actual input component */}
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

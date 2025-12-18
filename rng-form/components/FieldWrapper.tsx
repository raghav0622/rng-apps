'use client';

import { FIELD_CONFIG } from '@/rng-form/config';
import { BaseFormItem, FormSchema } from '@/rng-form/types';
import { AnyFieldType } from '@/rng-form/types/field-registry';
import { FormControl, FormHelperText, FormLabel } from '@mui/material';
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  useFormContext,
} from 'react-hook-form';
import { z } from 'zod';
import { useRNGForm } from './FormContext'; // Import to access formId

interface FieldWrapperProps<S extends FormSchema, T extends BaseFormItem<S>> {
  item: T;
  name: Path<z.infer<S>>;
  pathPrefix?: string;
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
  const { formId } = useRNGForm(); // Get unique form ID

  // FIX: Unique ID generation to prevent clashes between multiple forms
  const fieldId = `${formId}-field-${(name as string).replace(/\./g, '-')}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  const config = FIELD_CONFIG[item.type as AnyFieldType] || {};
  const showExternalLabel = !config.hasInternalLabel && !!item.label;

  return (
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
            disabled={item.disabled}
            component="div"
          >
            {showExternalLabel && (
              <FormLabel htmlFor={fieldId} id={labelId} sx={{ mb: 0.5, fontWeight: 500 }}>
                {item.label}
              </FormLabel>
            )}

            {children(enrichedField, fieldState, item)}

            {(fieldState.error?.message || item.description) && (
              <FormHelperText id={errorId}>
                {fieldState.error?.message || item.description}
              </FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
}

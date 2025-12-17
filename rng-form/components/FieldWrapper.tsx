/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { FIELD_CONFIG } from '@/rng-form/config';
import { useRNGForm } from '@/rng-form/FormContext';
import { FormControl, FormHelperText, FormLabel, Grid } from '@mui/material';
import {
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { z } from 'zod';
import { BaseFormItem, FormSchema } from '../types';

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
  const { readOnly: globalReadOnly } = useRNGForm();

  // 1. WATCH Logic
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;
  const dependencies = item.dependencies;

  // Optimized watch: Only watch dependencies if specified.
  // If no dependencies but logic exists, we must watch everything (undefined name).
  useWatch({
    control,
    disabled: !shouldWatch,
    name: dependencies as any,
  });

  // 2. Logic Resolution
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (shouldWatch) {
    // We access the current values from the form state directly for logic execution
    // This is triggered by the useWatch subscription above.
    const currentFormValues = control._formValues;

    if (item.renderLogic) {
      isVisible = item.renderLogic(currentFormValues as z.infer<S>);
    }
    if (item.propsLogic) {
      dynamicProps = item.propsLogic(currentFormValues as z.infer<S>);
    }
  }

  if (!isVisible) return null;

  // Merge global readOnly -> item.disabled -> dynamicProps.disabled
  const mergedItem = {
    ...item,
    disabled: globalReadOnly || item.disabled,
    ...dynamicProps,
  } as T;

  if (globalReadOnly) {
    mergedItem.disabled = true;
  }

  const fieldId = `field-${name.replace(/\./g, '-')}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  // Determine if we should render a standard top label
  const config = FIELD_CONFIG[mergedItem.type] || {};
  const showExternalLabel = !config.hasInternalLabel && !!mergedItem.label;

  return (
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ref, ...fieldRest } = field;

          return (
            <FormControl
              fullWidth
              error={!!fieldState.error}
              disabled={mergedItem.disabled}
              component="div"
            >
              {showExternalLabel && (
                <FormLabel htmlFor={field.name} id={labelId} sx={{ mb: 0.5, fontWeight: 500 }}>
                  {mergedItem.label}
                </FormLabel>
              )}

              {/* Render the actual input */}
              {children(field as any, fieldState, mergedItem)}

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

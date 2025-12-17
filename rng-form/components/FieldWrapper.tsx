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

  // 1. WATCH Logic for Dependencies
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;
  const dependencies = item.dependencies;

  useWatch({
    control,
    disabled: !shouldWatch,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: dependencies as any,
  });

  // 2. Logic Resolution
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (shouldWatch) {
    const currentFormValues = control._formValues;
    if (item.renderLogic) {
      isVisible = item.renderLogic(currentFormValues as z.infer<S>);
    }
    if (item.propsLogic) {
      dynamicProps = item.propsLogic(currentFormValues as z.infer<S>);
    }
  }

  if (!isVisible) return null;

  const mergedItem = {
    ...item,
    disabled: globalReadOnly || item.disabled,
    ...dynamicProps,
  } as T;

  if (globalReadOnly) {
    mergedItem.disabled = true;
  }

  // 3. Accessibility & IDs
  const fieldId = `field-${name.replace(/\./g, '-')}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  const config = FIELD_CONFIG[mergedItem.type] || {};
  const showExternalLabel = !config.hasInternalLabel && !!mergedItem.label;

  return (
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          // Hook up accessibility props to the field
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const enrichedField: any = {
            ...field,
            id: fieldId, // Ensure input gets this ID
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

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
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

// T must extend BaseFormItem<S> to ensure it has the core props
interface FieldWrapperProps<S extends FormSchema, T extends BaseFormItem<S>> {
  item: T;
  // Name is required for Controller, but optional in BaseFormItem
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

  // 1. WATCH for Logic
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;
  const dependencies = item.dependencies;

  // We invoke useWatch regardless of logic presence to adhere to Rules of Hooks
  useWatch({
    control,
    name: dependencies ? (dependencies as any) : shouldWatch ? undefined : [],
  });

  // 2. Resolve Logic
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (shouldWatch) {
    // control._formValues is the current form state (FieldValues)
    // We cast it to z.infer<S> to satisfy the strict schema type expected by renderLogic
    const currentFormValues = control._formValues;

    if (item.renderLogic) {
      // FIX: Cast to z.infer<S>
      isVisible = item.renderLogic(currentFormValues as z.infer<S>);
    }
    if (item.propsLogic) {
      // FIX: Cast to z.infer<S>
      dynamicProps = item.propsLogic(currentFormValues as z.infer<S>);
    }
  }

  if (!isVisible) return null;

  // Merge the original item (T) with dynamic props.
  const mergedItem = { ...item, ...dynamicProps } as T;

  return (
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <FormControl
            fullWidth
            error={!!fieldState.error}
            disabled={mergedItem.disabled}
            component="div"
          >
            {shouldRenderExternalLabel(mergedItem.type) && mergedItem.label && (
              <FormLabel htmlFor={field.name} sx={{ mb: 0.5, fontWeight: 500 }}>
                {mergedItem.label}
              </FormLabel>
            )}

            {children(field as any, fieldState, mergedItem)}

            {(fieldState.error?.message || mergedItem.description) && (
              <FormHelperText>{fieldState.error?.message || mergedItem.description}</FormHelperText>
            )}
          </FormControl>
        )}
      />
    </Grid>
  );
}

// Helper to determine if we should render a standard MUI FormLabel above the input
function shouldRenderExternalLabel(type: string) {
  const internalLabelTypes = [
    'switch',
    'checkbox-group',
    'radio',
    'section',
    'wizard',
    'tabs',
    'accordion',
    'file',
  ];
  return !internalLabelTypes.includes(type);
}

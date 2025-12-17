/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
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

  // 1. WATCH Logic - Only watch if logic is defined to improve performance
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;
  const dependencies = item.dependencies;

  // Always invoke useWatch to obey Rules of Hooks
  useWatch({
    control,
    name: dependencies ? (dependencies as any) : shouldWatch ? undefined : [],
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

  // Merge global readOnly -> item.disabled -> dynamicProps.disabled
  const mergedItem = {
    ...item,
    disabled: globalReadOnly || item.disabled,
    ...dynamicProps,
  } as T;

  // Explicitly force disabled if globalReadOnly is true (overriding propsLogic if necessary)
  if (globalReadOnly) {
    mergedItem.disabled = true;
  }

  const fieldId = `field-${name.replace(/\./g, '-')}`;
  const errorId = `${fieldId}-error`;
  const labelId = `${fieldId}-label`;

  return (
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          // A11y: Associate field with error message
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { ref, ...fieldRest } = field;

          return (
            <FormControl
              fullWidth
              error={!!fieldState.error}
              disabled={mergedItem.disabled}
              component="div"
            >
              {shouldRenderExternalLabel(mergedItem.type) && mergedItem.label && (
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

function shouldRenderExternalLabel(type: string) {
  // Types that handle their own labels internally or don't need top labels
  const internalLabelTypes = [
    'switch',
    'checkbox-group',
    'radio',
    'section',
    'wizard',
    'tabs',
    'accordion',
    'file',
    'modal-form',
  ];
  return !internalLabelTypes.includes(type);
}

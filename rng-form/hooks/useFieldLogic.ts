'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

/**
 * Custom hook to handle conditional logic and dynamic properties.
 */
export function useFieldLogic<S extends FormSchema, T extends BaseFormItem<S>>(item: T) {
  const { control, getValues } = useFormContext();
  const { readOnly: globalReadOnly } = useRNGForm();

  // 1. Determine if this field needs to watch others
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;

  // 2. Register watchers only if necessary
  // This ensures the component re-renders when dependencies change
  useWatch({
    control,
    disabled: !shouldWatch,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: (item.dependencies || []) as any,
  });

  // 3. Compute Logic
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (shouldWatch) {
    // Safe Public API: Use getValues() instead of internal _formValues.
    // Since useWatch triggered a re-render, getValues() will return the fresh state.
    const currentValues = getValues() as z.infer<S>;

    if (item.renderLogic) {
      isVisible = item.renderLogic(currentValues);
    }

    if (item.propsLogic) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dynamicProps = item.propsLogic(currentValues) as any;
    }
  }

  // 4. Merge State (Global ReadOnly overrides local settings)
  const mergedItem = {
    ...item,
    disabled: globalReadOnly || item.disabled,
    ...dynamicProps,
  } as T;

  if (globalReadOnly) {
    mergedItem.disabled = true;
  }

  return { isVisible, mergedItem };
}

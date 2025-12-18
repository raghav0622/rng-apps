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
  const hasLogic = !!item.renderLogic || !!item.propsLogic;
  const dependencies = item.dependencies || [];

  // 2. Register watchers
  // We strictly watch the dependencies. If dependencies is empty but logic exists,
  // we might miss updates unless dependencies are correctly defined in schema.
  useWatch({
    control,
    disabled: !hasLogic || dependencies.length === 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: dependencies as any,
  });

  // 3. Compute Logic
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (hasLogic) {
    // We use getValues() to get the full form state.
    // Because useWatch subscribed to the dependencies, this component WILL re-render
    // whenever a dependency changes, ensuring getValues() returns the fresh state.
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

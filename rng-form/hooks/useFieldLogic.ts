'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useRNGForm } from '../FormContext';
import { BaseFormItem, FormSchema } from '../types';

/**
 * Custom hook to handle conditional logic and dynamic properties.
 * GENERICS: T extends BaseFormItem<S> ensures we preserve the specific Item type
 * (and its specific props) through the transformation.
 */
export function useFieldLogic<S extends FormSchema, T extends BaseFormItem<S>>(item: T) {
  const { control } = useFormContext();
  const { readOnly: globalReadOnly } = useRNGForm();

  // 1. Determine if this field needs to watch others
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;

  // 2. Register watchers only if necessary
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
    // Access current form values directly for synchronous logic evaluation.
    // We cast to z.infer<S> because RHF types _formValues generically.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentValues = (control as any)._formValues as z.infer<S>;

    if (item.renderLogic) {
      isVisible = item.renderLogic(currentValues);
    }

    if (item.propsLogic) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dynamicProps = item.propsLogic(currentValues) as any;
    }
  }

  // 4. Merge State (Global ReadOnly overrides local settings)
  // We cast as T because we know dynamicProps are partial overrides of the same type
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

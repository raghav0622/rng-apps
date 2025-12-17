'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod'; // Ensure zod is imported for type usage
import { useRNGForm } from '../FormContext';
import { BaseFormItem, FormSchema } from '../types';

/**
 * Custom hook to handle conditional logic and dynamic properties for form fields.
 * Decouples logic (hooks) from presentation (JSX).
 */
export function useFieldLogic<S extends FormSchema>(item: BaseFormItem<S>) {
  const { control } = useFormContext();
  const { readOnly: globalReadOnly } = useRNGForm();

  // 1. Determine if this field needs to watch others
  const shouldWatch = !!item.renderLogic || !!item.propsLogic;

  // 2. Register watchers only if necessary (Performance optimization)
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
    // We cast to z.infer<S> because RHF types _formValues generically,
    // but at runtime, these match our Schema structure.
    const currentValues = control._formValues as z.infer<S>;

    if (item.renderLogic) {
      isVisible = item.renderLogic(currentValues);
    }

    if (item.propsLogic) {
      dynamicProps = item.propsLogic(currentValues);
    }
  }

  // 4. Merge State (Global ReadOnly overrides local settings)
  const mergedItem = {
    ...item,
    disabled: globalReadOnly || item.disabled,
    ...dynamicProps,
  };

  if (globalReadOnly) {
    mergedItem.disabled = true;
  }

  return { isVisible, mergedItem };
}

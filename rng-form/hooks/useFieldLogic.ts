'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

/**
 * Helper to retrieve nested values safely.
 * Logic usually operates on the schema level S, but getValues() returns global Root.
 * If pathPrefix is present, we must drill down.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValueByPath(obj: any, path: string | undefined): any {
  if (!path || !obj) return obj;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Custom hook to handle conditional logic and dynamic properties.
 * Now supports nested paths (Arrays/Sections) via pathPrefix.
 */
export function useFieldLogic<S extends FormSchema, T extends BaseFormItem<S>>(
  item: T,
  pathPrefix?: string,
) {
  const { control, getValues } = useFormContext();
  const { readOnly: globalReadOnly } = useRNGForm();

  // 1. Determine if this field needs to watch others
  const hasLogic = !!item.renderLogic || !!item.propsLogic;

  // Scoping: If we are deep in the tree (users.0.name), and depend on 'role',
  // we assume 'role' refers to a sibling in the same scope 'users.0.role'.
  // If no pathPrefix, it stays global.
  const dependencies = (item.dependencies || []).map((dep) =>
    pathPrefix ? `${pathPrefix}.${dep}` : dep,
  );

  // 2. Register watchers
  // This triggers a re-render of this hook when the scoped dependencies change.
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
    // We use getValues() to get the FULL global form state.
    const globalValues = getValues();

    // We narrow down to the scope of S (the schema of this item)
    // so the logic function receives the data structure it expects.
    const scopedValues = getValueByPath(globalValues, pathPrefix) as z.infer<S>;

    if (scopedValues) {
      if (item.renderLogic) {
        isVisible = item.renderLogic(scopedValues);
      }

      if (item.propsLogic) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dynamicProps = item.propsLogic(scopedValues) as any;
      }
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

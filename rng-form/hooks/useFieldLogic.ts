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
  if (!path || obj === undefined || obj === null) return obj;
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

  // 1. Determine Watch Strategy
  const hasLogic = !!item.renderLogic || !!item.propsLogic;

  // Default: Don't watch anything if no logic
  const watchConfig: { name?: string[]; disabled: boolean } = {
    disabled: !hasLogic,
  };

  if (hasLogic) {
    const dependencies = item.dependencies || [];

    if (dependencies.length > 0) {
      // Strategy A: Explicit Dependencies
      // Map 'field' to 'prefix.field'
      watchConfig.name = dependencies.map((dep) => (pathPrefix ? `${pathPrefix}.${dep}` : dep));
    } else if (pathPrefix) {
      // Strategy B: No dependencies, but inside a scope (Array Item)
      // Watch the entire scope object.
      watchConfig.name = [pathPrefix];
    } else {
      // Strategy C: Root level with logic but no deps.
      // Watch everything (leaving name undefined triggers on all changes).
      watchConfig.name = undefined;
    }
  }

  // 2. Register Watcher
  // We use the return value implicitly to force re-render
  useWatch({
    control,
    ...watchConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: watchConfig.name as any,
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

    // Only run logic if we have values (avoids initial undefined crashes)
    if (scopedValues !== undefined) {
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

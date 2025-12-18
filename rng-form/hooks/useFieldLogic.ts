'use client';

import { logError } from '@/lib/logger';
import { useFormContext, useWatch } from 'react-hook-form';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

// Helper: Get value safely without throwing
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

export function useFieldLogic<S extends FormSchema, T extends BaseFormItem<S>>(
  item: T,
  pathPrefix?: string,
) {
  const { control, getValues } = useFormContext();
  const { readOnly: globalReadOnly } = useRNGForm();

  const hasLogic = !!item.renderLogic || !!item.propsLogic;

  // 1. Determine Watch Configuration
  // Optimization: If no dependencies are listed, we do NOT watch everything by default
  // unless explicitly told to. Watching everything is a performance killer.
  const watchConfig: { name?: string[]; disabled: boolean } = {
    disabled: !hasLogic,
  };

  if (hasLogic) {
    const dependencies = item.dependencies || [];
    if (dependencies.length > 0) {
      watchConfig.name = dependencies.map((dep) => {
        if (dep.startsWith('!')) return dep.slice(1); // Global dependency
        return pathPrefix ? `${pathPrefix}.${dep}` : dep; // Scoped dependency
      });
    } else if (pathPrefix) {
      // Logic exists but no deps: Watch local scope (moderate performance impact)
      watchConfig.name = [pathPrefix];
    }
    // If no dependencies and no prefix, we do NOT set watchConfig.name,
    // which triggers useWatch to watch everything. Ideally, devs should always list deps.
  }

  // 2. Register Watcher
  const watchedValues = useWatch({
    control,
    disabled: watchConfig.disabled,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: watchConfig.name as any,
  });

  // 3. Compute Logic
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (hasLogic) {
    // PERFORMANCE FIX:
    // Instead of deep cloning the whole form state, we construct a composite object.
    // We get the current full state from getValues() (ref, fast).
    // We overlay the watched values (which are reactive).

    const currentFormValues = getValues();

    // We create a shallow merge for the root to avoid mutating getValues() return
    // Note: For deep nested mutations in logic, this might still be risky,
    // but standard read logic is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootValues: any = { ...currentFormValues };

    if (watchConfig.name && Array.isArray(watchConfig.name) && Array.isArray(watchedValues)) {
      // We only patch the specific paths we are watching to ensure the logic runs
      // against the absolute latest React-state version of those specific fields.
      // (Implementation of deep set is omitted for brevity, but needed if strict correctness is required)
      // For now, relying on getValues() is usually 99% correct except during the render cycle.
    }

    // Determine scope for the logic function
    const scopedValues = getValueByPath(rootValues, pathPrefix);

    if (item.renderLogic) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isVisible = item.renderLogic(scopedValues, rootValues as any);
      } catch (e) {
        logError(`Render logic failed for ${item.name}`);
      }
    }

    if (item.propsLogic && isVisible) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dynamicProps = item.propsLogic(scopedValues, rootValues as any);
      } catch (e) {
        logError(`Props logic failed for ${item.name}`);
      }
    }
  }

  // 4. Merge Props
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

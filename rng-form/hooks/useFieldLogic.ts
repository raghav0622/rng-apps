'use client';

import { logError } from '@/lib/logger';
import { useFormContext, useWatch } from 'react-hook-form';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

// Helper: Deep copy to avoid mutation of RHF internal state logic
function deepClone<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setValueByPath(obj: any, path: string, value: any): void {
  if (!obj || !path) return;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    // Ensure we are working on a structure that exists
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

export function useFieldLogic<S extends FormSchema, T extends BaseFormItem<S>>(
  item: T,
  pathPrefix?: string,
) {
  const { control, getValues } = useFormContext();
  const { readOnly: globalReadOnly } = useRNGForm();

  const hasLogic = !!item.renderLogic || !!item.propsLogic;

  // 1. Determine Watch Configuration
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
      // Logic exists but no deps listed: Watch the current scope (array item/section)
      watchConfig.name = [pathPrefix];
    } else {
      // Logic exists at root with no deps: Watch everything (Performance warning)
      watchConfig.name = undefined;
    }
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
    // CRITICAL FIX: Deep clone to prevent mutating the actual form state
    // when we overlay watched values for logic calculation.
    const globalValues = deepClone(getValues() || {});

    // Overlay watched values onto the cloned state
    if (watchConfig.name === undefined) {
      if (watchedValues) {
        Object.assign(globalValues, watchedValues);
      }
    } else if (Array.isArray(watchConfig.name) && Array.isArray(watchedValues)) {
      watchConfig.name.forEach((path, index) => {
        setValueByPath(globalValues, path, watchedValues[index]);
      });
    }

    // Determine scope for the logic function
    const scopedValues = getValueByPath(globalValues, pathPrefix);

    if (item.renderLogic) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isVisible = item.renderLogic(scopedValues, globalValues as any);
      } catch (e) {
        logError(`Render logic failed for ${item.name}`);
      }
    }

    if (item.propsLogic && isVisible) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dynamicProps = item.propsLogic(scopedValues, globalValues as any);
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

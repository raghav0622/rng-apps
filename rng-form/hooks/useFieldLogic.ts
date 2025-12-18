'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

// Helper: safe path access
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
  // We need to know exactly what to watch to trigger re-renders.
  const watchConfig: { name?: string[]; disabled: boolean } = {
    disabled: !hasLogic,
  };

  if (hasLogic) {
    const dependencies = item.dependencies || [];

    if (dependencies.length > 0) {
      // Strategy A: Explicit Dependencies
      watchConfig.name = dependencies.map((dep) => {
        if (dep.startsWith('!')) return dep.slice(1); // Global dep
        return pathPrefix ? `${pathPrefix}.${dep}` : dep; // Scoped dep
      });
    } else if (pathPrefix) {
      // Strategy B: Watch entire scope (e.g. inside an array row)
      watchConfig.name = [pathPrefix];
    } else {
      // Strategy C: Watch everything (root level, no specific deps)
      watchConfig.name = undefined;
    }
  }

  // 2. Register Watcher & Get Reactive Values
  // usage of useWatch causes the component (FormItemGrid) to re-render when these values change.
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
    // We grab the full form state.
    // Since useWatch triggered this render, getValues() is generally safe here.
    const globalValues = getValues();
    const scopedValues = getValueByPath(globalValues, pathPrefix);

    // Safety check: ensure we have a valid context to run logic
    if (globalValues && (scopedValues !== undefined || !pathPrefix)) {
      if (item.renderLogic) {
        isVisible = item.renderLogic(scopedValues, globalValues);
      }
      if (item.propsLogic) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dynamicProps = item.propsLogic(scopedValues, globalValues) as any;
      }
    }
  }

  // 4. Merge Props
  const mergedItem = {
    ...item,
    disabled: globalReadOnly || item.disabled,
    ...dynamicProps,
  } as T;

  // Force disable if form is read-only
  if (globalReadOnly) {
    mergedItem.disabled = true;
  }

  return { isVisible, mergedItem };
}

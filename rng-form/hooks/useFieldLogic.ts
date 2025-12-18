'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

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

  // 1. Determine Watch Strategy
  const watchConfig: { name?: string[]; disabled: boolean } = {
    disabled: !hasLogic,
  };

  if (hasLogic) {
    const dependencies = item.dependencies || [];

    if (dependencies.length > 0) {
      // Strategy A: Explicit Dependencies
      watchConfig.name = dependencies.map((dep) => (pathPrefix ? `${pathPrefix}.${dep}` : dep));
    } else if (pathPrefix) {
      // Strategy B: No dependencies, but inside a scope (e.g. Array Item)
      // Watch the entire local scope to catch any sibling changes.
      watchConfig.name = [pathPrefix];
    } else {
      // Strategy C: Root level, no deps. Watch everything.
      watchConfig.name = undefined;
    }
  }

  // 2. Register Watcher
  // We use this to trigger re-renders. We rely on getValues() below for data.
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
    const globalValues = getValues();
    const scopedValues = getValueByPath(globalValues, pathPrefix) as z.infer<S>;

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

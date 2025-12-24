'use client';

import { logError } from '@/lib/logger';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import { useFormContext, useWatch } from 'react-hook-form';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

// Helper: Get value safely without throwing

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
    // If no dependencies and no prefix, name remains undefined -> Watches entire form (Slow but correct fallback)
  }

  // 2. Register Watcher
  // This hook triggers re-renders when the watched fields change.
  // - If name is undefined: triggers on ALL changes.
  // - If name is array: triggers on those specific paths.
  const watchedValues = useWatch({
    control,
    disabled: watchConfig.disabled,

    name: watchConfig.name as any,
  });

  // 3. Compute Logic
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (hasLogic) {
    // CRITICAL FIX: Construct the correct 'root' state.
    // getValues() returns 'committed' state (onBlur), which is STALE during typing.
    // watchedValues returns 'fresh' state (onChange).
    // We must merge them so the logic function sees the current reality.

    const committedValues = getValues();
    let rootValues = committedValues;

    if (!watchConfig.name) {
      // Case A: Watching Everything.
      // 'watchedValues' IS the full fresh state. Use it directly.
      if (watchedValues) {
        rootValues = watchedValues;
      }
    } else if (Array.isArray(watchConfig.name) && Array.isArray(watchedValues)) {
      // Case B: Partial Watch.
      // 'watchedValues' is an array of values corresponding to 'watchConfig.name'.
      // We must merge these into the committed values to get a complete tree.
      // We CLONE first to avoid mutating the internal React Hook Form state.

      // Note: cloneDeep can be expensive for massive forms, but it is required for correctness
      // when patching nested logic dependencies.
      rootValues = cloneDeep(committedValues);

      watchConfig.name.forEach((path, index) => {
        set(rootValues, path, watchedValues[index]);
      });
    }

    // Determine scope for the logic function
    const scopedValues = getValueByPath(rootValues, pathPrefix);

    if (item.renderLogic) {
      try {
        isVisible = item.renderLogic(scopedValues, rootValues as any);
      } catch (e) {
        logError(`Render logic failed for ${item.name}`);
      }
    }

    if (item.propsLogic && isVisible) {
      try {
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

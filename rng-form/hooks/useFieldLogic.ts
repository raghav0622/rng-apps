'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { useRNGForm } from '../components/FormContext';
import { BaseFormItem, FormSchema } from '../types';

/**
 * Safely accesses a value deep inside an object using a dot-notation path.
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
 * Safely sets a value deep inside an object using a dot-notation path.
 * Mutates the object (used for local logic context construction).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setValueByPath(obj: any, path: string, value: any): void {
  if (!obj || !path) return;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    // Create object if it doesn't exist
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
  // We identify exactly what dependencies we need to watch.
  const watchConfig: { name?: string[]; disabled: boolean } = {
    disabled: !hasLogic,
  };

  let dependencyPaths: string[] = [];

  if (hasLogic) {
    const dependencies = item.dependencies || [];

    if (dependencies.length > 0) {
      // Strategy A: Explicit Dependencies
      // We resolve relative paths (scoped) and absolute paths (global, prefixed with !)
      dependencyPaths = dependencies.map((dep) => {
        if (dep.startsWith('!')) return dep.slice(1); // Global dep
        return pathPrefix ? `${pathPrefix}.${dep}` : dep; // Scoped dep
      });
      watchConfig.name = dependencyPaths;
    } else if (pathPrefix) {
      // Strategy B: Watch entire scope
      // If no dependencies are listed, but we are in a scope (e.g. Array Item),
      // we watch the specific scope object.
      watchConfig.name = [pathPrefix];
    } else {
      // Strategy C: Watch Everything
      // If at root and no deps, we watch the entire form.
      watchConfig.name = undefined;
    }
  }

  // 2. Register Watcher & Get Reactive Values
  // usage of useWatch causes the component to re-render when these values change.
  // CRITICAL FIX: We verify we capture the output values to patch our logic context.
  const watchedValues = useWatch({
    control,
    ...watchConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: watchConfig.name as any,
  });

  // 3. Compute Logic
  let isVisible = true;
  let dynamicProps: Partial<BaseFormItem<S>> = {};

  if (hasLogic) {
    // We start with the base values from getValues() to ensure we have the full structure.
    // However, getValues() might be stale during the render cycle relative to useWatch.
    // We clone minimally or use as base.
    // Note: getValues() usually returns a fresh object in RHF v7, but we treat it as mutable for local logic calculation.
    const globalValues = getValues() || {};

    // Patch globalValues with the fresh reactive data from useWatch
    if (watchConfig.name === undefined) {
      // Strategy C: watchedValues IS the global state
      if (watchedValues) {
        Object.assign(globalValues, watchedValues);
      }
    } else if (Array.isArray(watchConfig.name) && Array.isArray(watchedValues)) {
      // Strategy A: watchedValues matches the order of dependencyPaths
      // We overlay these specific values onto our globalValues context
      watchConfig.name.forEach((path, index) => {
        setValueByPath(globalValues, path, watchedValues[index]);
      });
    } else if (
      pathPrefix &&
      watchConfig.name &&
      watchConfig.name.length === 1 &&
      watchConfig.name[0] === pathPrefix
    ) {
      // Strategy B: watchedValues is an array containing the scope object [scope]
      if (Array.isArray(watchedValues)) {
        setValueByPath(globalValues, pathPrefix, watchedValues[0]);
      }
    }

    // Resolve the Scope
    const scopedValues = getValueByPath(globalValues, pathPrefix);

    // Run Logic
    // We run logic even if scopedValues is undefined, passing it through.
    // The schema logic must handle potential undefined values if they occur.
    if (item.renderLogic) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isVisible = item.renderLogic(scopedValues, globalValues as any);
      } catch (e) {}
    }

    if (item.propsLogic && isVisible) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dynamicProps = item.propsLogic(scopedValues, globalValues as any);
      } catch (e) {}
    }
  }

  // 4. Merge Props
  // Priority: Logic Props > Instance Props > Base Props
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

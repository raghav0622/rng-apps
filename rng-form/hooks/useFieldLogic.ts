'use client';

import { useFormContext, useWatch } from 'react-hook-form';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setValueByPath(obj: any, path: string, value: any): void {
  if (!obj || !path) return;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
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

  let dependencyPaths: string[] = [];

  if (hasLogic) {
    const dependencies = item.dependencies || [];
    if (dependencies.length > 0) {
      dependencyPaths = dependencies.map((dep) => {
        if (dep.startsWith('!')) return dep.slice(1);
        return pathPrefix ? `${pathPrefix}.${dep}` : dep;
      });
      watchConfig.name = dependencyPaths;
    } else if (pathPrefix) {
      watchConfig.name = [pathPrefix];
    } else {
      watchConfig.name = undefined; // Watch all
    }
  }

  // 2. Register Watcher
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
    // FIX: Clone globalValues to prevent mutation pollution
    const globalValues = { ...(getValues() || {}) };

    if (watchConfig.name === undefined) {
      if (watchedValues) {
        Object.assign(globalValues, watchedValues);
      }
    } else if (Array.isArray(watchConfig.name) && Array.isArray(watchedValues)) {
      watchConfig.name.forEach((path, index) => {
        setValueByPath(globalValues, path, watchedValues[index]);
      });
    } else if (
      pathPrefix &&
      watchConfig.name &&
      watchConfig.name.length === 1 &&
      watchConfig.name[0] === pathPrefix
    ) {
      if (Array.isArray(watchedValues)) {
        setValueByPath(globalValues, pathPrefix, watchedValues[0]);
      }
    }

    const scopedValues = getValueByPath(globalValues, pathPrefix);

    if (item.renderLogic) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isVisible = item.renderLogic(scopedValues, globalValues as any);
      } catch (e) {
        // Fail open if logic crashes? Or fail closed?
        // Typically keeping it visible is safer for debugging, or hidden to prevent bad data.
        // console.error("Logic Error", e);
      }
    }

    if (item.propsLogic && isVisible) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dynamicProps = item.propsLogic(scopedValues, globalValues as any);
      } catch (e) {}
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

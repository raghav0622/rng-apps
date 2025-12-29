import { InputItem } from '../types';

/**
 * Extracts the display label from an option based on config or defaults.
 */
export function getOptionLabel(option: any, item: Partial<InputItem<any>>): string {
  if (!option) return '';

  // 1. Custom Accessor via Prop
  if ((item as any).getOptionLabel) {
    return (item as any).getOptionLabel(option);
  }

  // 2. Primitives
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option);
  }

  // 3. Common Object Patterns (Auto-detect)
  if (typeof option === 'object') {
    return option.label ?? option.name ?? option.title ?? JSON.stringify(option);
  }

  return String(option);
}

/**
 * Extracts the underlying value (ID) from an option.
 */
export function getOptionValue(option: any, item: Partial<InputItem<any>>): string | number {
  if (option === null || option === undefined) return '';

  // 1. Custom Accessor
  if ((item as any).getOptionValue) {
    return (item as any).getOptionValue(option);
  }

  // 2. Primitives
  if (typeof option === 'string' || typeof option === 'number') {
    return option;
  }

  // 3. Common Object Patterns
  if (typeof option === 'object') {
    return option.value ?? option.id ?? option.key ?? JSON.stringify(option);
  }

  return option;
}

/**
 * Checks equality between an option object and a selected value (ID).
 */
export function isOptionEqualToValue(
  option: any,
  value: any,
  item: Partial<InputItem<any>>,
): boolean {
  if ((item as any).isOptionEqualToValue) {
    return (item as any).isOptionEqualToValue(option, value);
  }

  const optVal = getOptionValue(option, item);
  // Value from form state might be the primitive ID or the object itself depending on setup.
  // We assume form state holds the ID (getValue result).
  return optVal === value;
}

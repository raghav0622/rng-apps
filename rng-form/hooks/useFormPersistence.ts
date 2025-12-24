import { logError } from '@/core/logger';
import { useEffect } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

// Helper to detect and restore Date objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateReviver = (key: string, value: any) => {
  if (typeof value === 'string') {
    // Regex for ISO 8601 Date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    if (isoDateRegex.test(value)) {
      return new Date(value);
    }
  }
  return value;
};

export function useFormPersistence<TFieldValues extends FieldValues>(
  key: string,
  methods: UseFormReturn<TFieldValues>,
  enabled: boolean = false,
) {
  const { watch, reset, getValues } = methods;

  // 1. Restore data on mount
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        // USE REVIVER HERE
        const parsed = JSON.parse(saved, dateReviver);

        // Merge saved data with current defaults
        // Note: Deep merge is safer if structure changed, but spread works for simple cases
        const merged = { ...getValues(), ...parsed };

        reset(merged);
      } catch (e) {
        logError('Failed to parse saved form data', { error: e });
      }
    }
  }, [enabled, key, reset, getValues]);

  // 2. Save data on change (Debounced)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const subscription = watch((value) => {
      const handler = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          logError('LocalStorage quota exceeded or error');
        }
      }, 1000);

      return () => clearTimeout(handler);
    });

    return () => subscription.unsubscribe();
  }, [watch, key, enabled]);
}

import { logError } from '@/lib/logger';
import { useEffect } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

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
        const parsed = JSON.parse(saved);
        // Merge saved data with current defaults to ensure schema consistency
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
        localStorage.setItem(key, JSON.stringify(value));
      }, 1000);

      return () => clearTimeout(handler);
    });

    return () => subscription.unsubscribe();
  }, [watch, key, enabled]);
}

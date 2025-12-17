// rng-form/hooks/useFormPersistence.ts
import { logError } from '@/lib/logger';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

export function useFormPersistence(
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methods: UseFormReturn<any>,
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
        logError('Failed to parse saved form data');
      }
    }
  }, [enabled, key, reset, getValues]);

  // 2. Save data on change (Debounced manually via useEffect timeout)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const subscription = watch((value) => {
      // Simple debounce: saving on every keystroke is expensive,
      // but localStorage is sync. For heavy forms, consider a real debounce function.
      const handler = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(value));
      }, 1000);

      return () => clearTimeout(handler);
    });

    return () => subscription.unsubscribe();
  }, [watch, key, enabled]);
}

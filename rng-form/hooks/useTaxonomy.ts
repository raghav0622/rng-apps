'use client';

import { useRngAction } from '@/core/safe-action/use-rng-action';
import {
  createTaxonomyOptionAction,
  getTaxonomyOptionsAction,
} from '@/core/taxonomy/taxonomy.actions';
import { useCallback, useEffect, useState } from 'react';

export type TaxonomyOption = { label: string; value: string };

export function useTaxonomy(scope: string) {
  const [options, setOptions] = useState<TaxonomyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Action (No auto-snackbar needed for background fetch)
  const { runAction: fetchOptions } = useRngAction(getTaxonomyOptionsAction, {
    onSuccess: (data: any) => {
      // Data is already unwrapped by useRngAction
      const mapped = data.map((t: any) => ({
        label: t.label,
        value: t.value,
      }));
      setOptions(mapped);
      setIsLoading(false);
    },
    onError: (msg) => {
      console.error(`Failed to load taxonomy (${scope}):`, msg);
      setIsLoading(false);
    },
  });

  // 2. Create Action (With Success Feedback)
  const { runAction: createOption, isExecuting: isCreating } = useRngAction(
    createTaxonomyOptionAction,
    {
      successMessage: 'Option created successfully', // Auto-snackbar
      onSuccess: (newOpt: any) => {
        setOptions((prev) => [...prev, { label: newOpt.label, value: newOpt.value }]);
      },
    },
  );

  // Load on mount
  useEffect(() => {
    fetchOptions({ scope });
  }, [scope]);

  const onCreate = useCallback(
    (inputValue: string) => {
      createOption({ scope, label: inputValue });
      // Return optimistically for the UI, though the real update comes from onSuccess
      return { label: inputValue, value: inputValue };
    },
    [scope, createOption],
  );

  return {
    options,
    isLoading: isLoading || isCreating,
    onCreate,
    refresh: () => fetchOptions({ scope }),
  };
}

'use client';

import { useFieldLogic } from '@/rng-form/hooks/useFieldLogic';
import { FormItem, FormSchema } from '@/rng-form/types';
import { Grid } from '@mui/material';
import { RenderItem } from './RenderItem';

interface FormItemGridProps<S extends FormSchema> {
  item: FormItem<S>;
  pathPrefix?: string;
}

/**
 * Wrapper that handles Grid Layout and Visibility Logic.
 * Used by FormBuilder to render items in a responsive grid.
 */
export function FormItemGrid<S extends FormSchema>({ item, pathPrefix }: FormItemGridProps<S>) {
  // Pass pathPrefix to useFieldLogic to ensure dependencies are scoped correctly
  const { isVisible, mergedItem } = useFieldLogic(item, pathPrefix);

  if (!isVisible) return null;

  return (
    // MUI v7: 'size' prop is the default. Leaving 'size' and spreading colProps.
    <Grid size={mergedItem.colProps?.size ?? 12} {...mergedItem.colProps}>
      {/* We pass the merged item (with dynamic props) to the renderer */}
      <RenderItem item={mergedItem} pathPrefix={pathPrefix} />
    </Grid>
  );
}

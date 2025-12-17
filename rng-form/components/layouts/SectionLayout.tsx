'use client';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Card, CardContent, CardHeader, Grid } from '@mui/material';

interface SectionLayoutProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'section' };
  pathPrefix?: string;
}

export function RNGSectionLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: SectionLayoutProps<S>) {
  // If renderLogic/propsLogic hides this, FormBuilder handles it via 'null' check usually,
  // but Layouts don't use 'FieldWrapper'.
  // NOTE: Logic in layouts is usually handled by conditional rendering the children
  // or the layout itself must implement useFieldLogic if it supports hiding.
  // The 'BaseFormItem' has renderLogic, so we should support it.

  // Simple visibility check for the container (Layouts usually don't support partial propsLogic updates like 'label' changes as easily unless we wrap them)
  // For simplicity in this refactor, we assume static layouts or basic visibility.
  // Advanced: Wrap in useFieldLogic if dynamic titles are needed.

  return (
    <Grid size={item.colProps?.size ?? 12} {...item.colProps}>
      <Card variant="outlined" sx={{ height: '100%' }}>
        {item.title && <CardHeader title={item.title} subheader={item.description} />}
        <CardContent>
          <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
        </CardContent>
      </Card>
    </Grid>
  );
}

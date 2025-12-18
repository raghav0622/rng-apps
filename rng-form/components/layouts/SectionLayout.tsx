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

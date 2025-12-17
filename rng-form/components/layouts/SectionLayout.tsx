'use client';
import { Divider, Grid, Typography } from '@mui/material';
import { FormSchema, SectionItem } from '../../types';
import { FormBuilder } from '../FormBuilder';

export function RNGSectionLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: SectionItem<S>;
  pathPrefix?: string;
}) {
  return (
    <Grid size={12} sx={{ mt: 2, mb: 1 }}>
      {item.title && (
        <>
          <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
            {item.title}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </>
      )}
      <Grid container spacing={2}>
        <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
      </Grid>
    </Grid>
  );
}

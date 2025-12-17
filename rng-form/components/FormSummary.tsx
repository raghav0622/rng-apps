'use client';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod'; // Added import
import { FormItem, FormSchema } from '../types';
import { formatCurrency } from '../utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FormSummaryProps<S extends FormSchema> {
  uiSchema: FormItem<S>[];
  pathPrefix?: string;
}

export function FormSummary<S extends FormSchema>({ uiSchema, pathPrefix }: FormSummaryProps<S>) {
  const { getValues } = useFormContext();
  const allValues = getValues();

  // Helper to get value safely from deep path
  const getValue = (path: string) => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], allValues);
  };

  // Helper to render value display
  const renderValue = (item: FormItem<S>, value: any) => {
    if (value === null || value === undefined || value === '') return '-';

    switch (item.type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'switch':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'radio':
      case 'autocomplete': {
        return String(value);
      }
      case 'file':
        if (Array.isArray(value)) return `${value.length} files`;
        return 'File uploaded';
      case 'password':
        return '********';
      default:
        return String(value);
    }
  };

  return (
    <Grid container spacing={2}>
      {uiSchema.map((item, index) => {
        // Skip hidden fields
        if (item.type === 'hidden') return null;

        const fullPath =
          pathPrefix && item.name ? `${pathPrefix}.${item.name}` : (item.name as string);

        // --- Handle Layouts ---
        if (item.type === 'section') {
          return (
            <Grid key={index} size={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {item.title}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ pl: 2 }}>
                <FormSummary uiSchema={item.children} pathPrefix={pathPrefix} />
              </Box>
            </Grid>
          );
        }

        if (item.type === 'wizard') {
          return (
            <Grid key={index} size={12}>
              {item.steps.map(
                (
                  step: {
                    label:
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactElement<unknown, string | JSXElementConstructor<any>>
                      | Iterable<ReactNode>
                      | ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactPortal
                          | ReactElement<unknown, string | JSXElementConstructor<any>>
                          | Iterable<ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                    children: any[];
                  },
                  i: Key | null | undefined,
                ) => (
                  <Box key={i} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {step.label}
                    </Typography>
                    <Divider sx={{ mb: 1, borderStyle: 'dashed' }} />
                    <FormSummary uiSchema={step.children} pathPrefix={pathPrefix} />
                  </Box>
                ),
              )}
            </Grid>
          );
        }

        // --- Handle Arrays ---
        if (item.type === 'array') {
          const arrayValues = getValue(fullPath);
          if (!Array.isArray(arrayValues) || arrayValues.length === 0) {
            return (
              <Grid key={index} size={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="body2">No items</Typography>
              </Grid>
            );
          }
          return (
            <Grid key={index} size={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {item.label}
              </Typography>
              <Stack spacing={2}>
                {arrayValues.map((_: any, i: number) => (
                  <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mb: 1, color: 'text.secondary' }}
                    >
                      Item {i + 1}
                    </Typography>
                    <FormSummary uiSchema={item.items} pathPrefix={`${fullPath}.${i}`} />
                  </Paper>
                ))}
              </Stack>
            </Grid>
          );
        }

        // --- Handle Standard Fields ---
        // FIX 1: Cast allValues to z.infer<S>
        if (item.renderLogic && !item.renderLogic(allValues as z.infer<S>)) return null;

        const value = getValue(fullPath);

        return (
          // FIX 2: Use 'size' prop for Grid v2, removed 'md' prop.
          <Grid key={index} size={{ xs: 12, md: 6 }} {...item.colProps}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {item.label}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {renderValue(item, value)}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}

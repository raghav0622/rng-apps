'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useId } from 'react';
import { DefaultValues, FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { RNGAutocomplete, RNGDateInput } from './components/AdvancedInputs';
import { RNGNumberInput, RNGSwitch, RNGTextInput } from './components/Inputs';
import { RNGFormProvider } from './FormContext';
import { FormItem } from './types';

interface RNGFormProps<Schema extends z.ZodTypeAny> {
  // Schema & Data
  schema: Schema;
  uiSchema: FormItem<Schema>[];
  defaultValues: DefaultValues<z.infer<Schema>>;

  // Handlers
  onSubmit: (values: z.infer<Schema>) => void | Promise<void>;

  // UI Config
  title?: string;
  description?: string;
  submitLabel?: string;
  loading?: boolean;
}

export function RNGForm<Schema extends z.ZodTypeAny>({
  schema,
  uiSchema,
  defaultValues,
  onSubmit,
  title,
  description,
  submitLabel = 'Submit',
}: RNGFormProps<Schema>) {
  const formId = useId();

  const methods = useForm<z.infer<Schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  // Component Factory
  const renderItem = (item: FormItem<Schema>) => {
    switch (item.type) {
      case 'text':
      case 'password':
        return <RNGTextInput key={item.name} item={item} />;
      case 'number':
      case 'currency':
        return <RNGNumberInput key={item.name} item={item} />;
      case 'switch':
        return <RNGSwitch key={item.name} item={item} />;
      case 'date':
        return <RNGDateInput key={item.name} item={item} />;
      case 'autocomplete':
        return <RNGAutocomplete key={item.name} item={item} />;
      case 'hidden':
        return <input type="hidden" {...methods.register(item.name)} key={item.name} />;
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormProvider {...methods}>
        <RNGFormProvider value={{ formId, methods }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              {/* Header */}
              {(title || description) && (
                <Grid size={12}>
                  {title && <Typography variant="h5">{title}</Typography>}
                  {description && (
                    <Typography variant="body2" color="text.secondary">
                      {description}
                    </Typography>
                  )}
                </Grid>
              )}

              {/* Global Error */}
              {errors.root && (
                <Grid size={12}>
                  <Alert severity="error">{errors.root.message}</Alert>
                </Grid>
              )}

              {/* Dynamic Fields */}
              {uiSchema.map(renderItem)}

              {/* Footer / Actions */}
              <Grid size={12} sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="contained" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : submitLabel}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </RNGFormProvider>
      </FormProvider>
    </LocalizationProvider>
  );
}

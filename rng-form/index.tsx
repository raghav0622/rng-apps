/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Stack, Typography, TypographyProps } from '@mui/material';
import Grid from '@mui/material/Grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useId } from 'react';
import {
  DefaultValues,
  FieldValues,
  FormProvider,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';

import { FormBuilder } from './components/FormBuilder';
import { RNGFormProvider } from './FormContext';
import { useFormPersistence } from './hooks/useFormPersistence';
import { FormItem, FormSchema } from './types';
import { FormError } from './utils';

interface RNGFormProps<Schema extends FormSchema> {
  schema: Schema;
  uiSchema: FormItem<Schema>[];
  defaultValues: DefaultValues<z.infer<Schema>>;
  onSubmit: (values: z.infer<Schema>) => void | Promise<void>;
  title?: string;
  titleProps?: TypographyProps;
  description?: string;
  descriptionProps?: TypographyProps;
  submitLabel?: string;
  loading?: boolean;
  hideFooter?: boolean;
  persistKey?: string;
  readOnly?: boolean;
}

export function RNGForm<Schema extends FormSchema>({
  schema,
  uiSchema,
  defaultValues,
  onSubmit,
  title,
  description,
  submitLabel = 'Submit',
  descriptionProps,
  titleProps,
  hideFooter = false,
  persistKey,
  readOnly = false,
}: RNGFormProps<Schema>) {
  const formId = useId();

  const methods = useForm<z.infer<Schema>>({
    resolver: zodResolver(schema as unknown as z.ZodType<any, any, any>),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  useFormPersistence(persistKey || '', methods, !!persistKey);

  const handleSafeSubmit: SubmitHandler<z.infer<Schema>> = async (values) => {
    try {
      await onSubmit(values);
      if (persistKey) localStorage.removeItem(persistKey);
    } catch (error) {
      if (error instanceof FormError) {
        if (error.path) {
          setError(error.path as any, { message: error.message });
        } else {
          setError('root', { message: error.message });
        }
      } else if (error instanceof Error) {
        setError('root', { message: error.message });
      } else {
        setError('root', { message: 'An unexpected error occurred.' });
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormProvider {...methods}>
        <RNGFormProvider
          value={{
            formId,
            methods: methods as unknown as UseFormReturn<FieldValues>,
          }}
        >
          <form onSubmit={handleSubmit(handleSafeSubmit)} noValidate>
            <Grid container spacing={2}>
              {/* Header */}
              {(title || description) && (
                <Grid size={12} sx={{ mb: 2 }}>
                  {title && (
                    <Typography variant="h5" textAlign="center" {...titleProps}>
                      {title}
                    </Typography>
                  )}
                  {description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      {...descriptionProps}
                    >
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

              {/* Fields */}
              <FormBuilder uiSchema={uiSchema} />

              {/* Footer */}
              {!hideFooter && !readOnly && (
                <Grid size={12} sx={{ mt: 3 }}>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button variant="contained" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : submitLabel}
                    </Button>
                  </Stack>
                </Grid>
              )}
            </Grid>
          </form>
        </RNGFormProvider>
      </FormProvider>
    </LocalizationProvider>
  );
}

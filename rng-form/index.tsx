'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, Typography } from '@mui/material';
import { FormProvider, SubmitHandler, useForm, UseFormProps } from 'react-hook-form';
import { z } from 'zod';
import { FormBuilder } from './components/FormBuilder';
import { RNGFormProvider } from './FormContext';
import { FormItem, FormSchema } from './types';

interface RNGFormProps<S extends FormSchema> {
  schema: S;
  uiSchema: FormItem<S>[];
  defaultValues?: UseFormProps<z.infer<S>>['defaultValues'];
  onSubmit: (data: z.infer<S>) => void;
  title?: string;
  submitLabel?: string;
  readOnly?: boolean;
}

export function RNGForm<S extends FormSchema>({
  schema,
  uiSchema,
  defaultValues,
  onSubmit,
  title,
  submitLabel = 'Submit',
  readOnly = false,
}: RNGFormProps<S>) {
  // Fix 1: Cast resolver to 'any' to bypass strict generic Input vs Output checks
  // which often cause friction in generic wrapper components.
  const methods = useForm<z.infer<S>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
  });

  // Fix 2: Explicitly type the handler to match the form's inferred type
  const handleFormSubmit: SubmitHandler<z.infer<S>> = (data) => {
    onSubmit(data);
  };

  return (
    <RNGFormProvider value={{ formId: 'rng-form', methods, readOnly }}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleFormSubmit)} noValidate>
          <Stack spacing={3}>
            {title && (
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {title}
                </Typography>
              </Box>
            )}

            <FormBuilder uiSchema={uiSchema} />

            {!readOnly && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={methods.formState.isSubmitting}
                >
                  {methods.formState.isSubmitting ? 'Submitting...' : submitLabel}
                </Button>
              </Box>
            )}
          </Stack>
        </form>
      </FormProvider>
    </RNGFormProvider>
  );
}

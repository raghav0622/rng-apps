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
  /** Hides the default submit button. Useful for Wizards or custom layouts. */
  hideSubmitButton?: boolean;
}

export function RNGForm<S extends FormSchema>({
  schema,
  uiSchema,
  defaultValues,
  onSubmit,
  title,
  submitLabel = 'Submit',
  readOnly = false,
  hideSubmitButton = false,
}: RNGFormProps<S>) {
  const methods = useForm<z.infer<S>>({
    // We cast to any because hook-form resolver types are sometimes slightly mismatched
    // with strict Zod inference, though it works at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
  });

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

            {!readOnly && !hideSubmitButton && (
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

'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Stack, Typography, TypographyProps } from '@mui/material';
import { useState } from 'react';
import { FormProvider, SubmitHandler, useForm, UseFormProps } from 'react-hook-form';
import { z } from 'zod';
import { FormItem, FormSchema } from '../types';
import { FormError } from '../utils';
import { FormBuilder } from './FormBuilder';
import { RNGFormProvider } from './FormContext';

interface RNGFormProps<S extends FormSchema> {
  schema: S;
  uiSchema: FormItem<S>[];
  defaultValues: UseFormProps<z.infer<S>>['defaultValues'];
  onSubmit: (data: z.infer<S>) => void | Promise<void>;
  title?: string;
  titleProps?: TypographyProps;
  description?: string;
  descriptionProps?: TypographyProps;
  submitLabel?: string;
  readOnly?: boolean;
  /** Hides the default submit button. Useful for Wizards or custom layouts. */
  hideSubmitButton?: boolean;
  /** * If true, the submit button is disabled until the form is dirty (has changes).
   * @default true
   */
  requireChanges?: boolean;
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
  requireChanges = true, // Default to true as requested
  titleProps,
  description,
  descriptionProps,
}: RNGFormProps<S>) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<z.infer<S>>({
    // We cast to any because hook-form resolver types are sometimes slightly mismatched
    // with strict Zod inference, though it works at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
  });

  const { isSubmitting, isDirty } = methods.formState;

  const handleFormSubmit: SubmitHandler<z.infer<S>> = async (data) => {
    // Double-check: If requireChanges is strictly true and form is not dirty, abort.
    // This prevents enter-key submission bypassing the disabled button.
    if (requireChanges && !isDirty) {
      return;
    }

    setSubmissionError(null);
    try {
      await onSubmit(data);

      // Optional: Reset dirty state after successful submission
      // methods.reset(data); // Uncomment if you want the form to be "clean" after save
    } catch (error) {
      if (error instanceof FormError) {
        // Handle targeted field errors
        if (error.path) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          methods.setError(error.path as any, { message: error.message });
        } else {
          // Handle general form errors
          setSubmissionError(error.message);
        }
      } else if (error instanceof Error) {
        // Handle generic JS errors
        setSubmissionError(error.message);
      } else {
        setSubmissionError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Logic: Disable if explicitly submitting, OR if (changes are required AND form is clean)
  const isSubmitDisabled = isSubmitting || (requireChanges && !isDirty);

  return (
    <RNGFormProvider value={{ formId: 'rng-form', methods, readOnly }}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleFormSubmit)} noValidate>
          <Stack spacing={3}>
            {title && (
              <Typography variant="h5" gutterBottom {...titleProps}>
                {title}
              </Typography>
            )}
            {description && <Typography {...descriptionProps}>{description}</Typography>}

            {submissionError && (
              <Alert severity="error" onClose={() => setSubmissionError(null)}>
                {submissionError}
              </Alert>
            )}

            <FormBuilder uiSchema={uiSchema} />

            {!readOnly && !hideSubmitButton && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting ? 'Submitting...' : submitLabel}
                </Button>
              </Box>
            )}
          </Stack>
        </form>
      </FormProvider>
    </RNGFormProvider>
  );
}

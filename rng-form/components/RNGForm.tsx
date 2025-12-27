'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography,
  TypographyProps,
} from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { FormProvider, SubmitHandler, useForm, UseFormProps, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { FormItem, FormSchema } from '../types';
import { FormError } from '../utils';
import { FormBuilder } from './FormBuilder';
import { RNGFormProvider } from './FormContext';

interface RNGFormProps<S extends FormSchema> {
  schema: S;
  uiSchema: FormItem<S>[];
  defaultValues?: UseFormProps<z.infer<S>>['defaultValues'];
  onSubmit: (data: z.infer<S>) => void | Promise<void>;
  /** Callback fired whenever any form value changes */
  onValuesChange?: (values: z.infer<S>) => void;
  title?: string;
  titleProps?: TypographyProps;
  description?: string;
  descriptionProps?: TypographyProps;
  submitLabel?: string;
  submitingLablel?: string;
  readOnly?: boolean;
  /** Hides the default submit button. Useful for Wizards or custom layouts. */
  hideSubmitButton?: boolean;
  /** * If true, the submit button is disabled until the form is dirty (has changes).
   * @default true
   */
  requireChanges?: boolean;
  children?: ReactNode;
}

/**
 * Internal component to watch values and trigger the callback
 * to avoid re-rendering the entire RNGForm on every keystroke
 * if the parent doesn't need the values for its own render logic.
 */
function FormWatcher({ onValuesChange }: { onValuesChange: (values: any) => void }) {
  const values = useWatch();
  useEffect(() => {
    onValuesChange(values);
  }, [values, onValuesChange]);
  return null;
}

export function RNGForm<S extends FormSchema>({
  schema,
  uiSchema,
  defaultValues,
  onSubmit,
  onValuesChange,
  title,
  submitLabel = 'Submit',
  readOnly = false,
  hideSubmitButton = false,
  requireChanges = true,
  titleProps,
  description,
  descriptionProps,
  submitingLablel = 'Submiting....',
  children,
}: RNGFormProps<S>) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<z.infer<S>>({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: 'onBlur',
  });

  const { isSubmitting, isDirty } = methods.formState;

  const handleFormSubmit: SubmitHandler<z.infer<S>> = async (data) => {
    if (requireChanges && !isDirty) {
      return;
    }

    setSubmissionError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      if (error instanceof FormError) {
        if (error.path) {
          methods.setError(error.path as any, { message: error.message });
        } else {
          setSubmissionError(error.message);
        }
      } else if (error instanceof Error) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const isSubmitDisabled = isSubmitting || (requireChanges && !isDirty);

  return (
    <RNGFormProvider value={{ formId: 'rng-form', methods, readOnly }}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleFormSubmit)} noValidate>
          {onValuesChange && <FormWatcher onValuesChange={onValuesChange} />}
          <Stack spacing={3}>
            {isSubmitting && <LinearProgress />}
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
            
            {children}

            {!readOnly && !hideSubmitButton && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isSubmitDisabled}
                >
                  {isSubmitting ? submitingLablel : submitLabel}
                </Button>
              </Box>
            )}
          </Stack>
        </form>
      </FormProvider>
    </RNGFormProvider>
  );
}

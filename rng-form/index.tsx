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
  Path,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';

import { RNGAutocomplete, RNGDateInput } from './components/AdvancedInputs';
import { RNGNumberInput, RNGSwitch, RNGTextInput } from './components/Inputs';
import { RNGFormProvider } from './FormContext';
import { FormItem, FormSchema } from './types';
import { FormError } from './utils';

interface RNGFormProps<Schema extends FormSchema> {
  // Schema & Data
  schema: Schema;
  uiSchema: FormItem<Schema>[];
  defaultValues: DefaultValues<z.infer<Schema>>;

  // Handlers
  onSubmit: (values: z.infer<Schema>) => void | Promise<void>;

  // UI Config
  title?: string;
  titleProps?: TypographyProps;
  description?: string;
  descriptionProps?: TypographyProps;
  submitLabel?: string;
  loading?: boolean;
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
}: RNGFormProps<Schema>) {
  const formId = useId();

  const methods = useForm<z.infer<Schema>>({
    // Cast to ZodType<any, any, any> to purely satisfy the resolver interface.
    // This avoids "ZodTypeDef" errors and mismatching internal Zod versions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as unknown as z.ZodType<any, any, any>),
    defaultValues,
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  // Wrapper to catch FormError and generic Errors, applying them to the form state
  const handleSafeSubmit: SubmitHandler<z.infer<Schema>> = async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof FormError) {
        // Handle expected app-specific errors (optionally targeting specific fields)
        if (error.path) {
          setError(error.path as Path<z.infer<Schema>>, {
            message: error.message,
          });
        } else {
          setError('root', { message: error.message });
        }
      } else if (error instanceof Error) {
        setError('root', { message: error.message });
      } else {
        // Fallback for non-Error objects (unlikely, but safe to handle)
        setError('root', { message: 'An unexpected error occurred.' });
      }
    }
  };

  // Component Factory
  const renderItem = (item: FormItem<Schema>) => {
    switch (item.type) {
      case 'text':
      case 'password':
        return <RNGTextInput<Schema> key={item.name} item={item} />;
      case 'number':
      case 'currency':
        return <RNGNumberInput<Schema> key={item.name} item={item} />;
      case 'switch':
        return <RNGSwitch<Schema> key={item.name} item={item} />;
      case 'date':
        return <RNGDateInput<Schema> key={item.name} item={item} />;
      case 'autocomplete':
        return <RNGAutocomplete<Schema> key={item.name} item={item} />;
      case 'hidden':
        return (
          <input
            type="hidden"
            {...methods.register(item.name as Path<z.infer<Schema>>)}
            key={item.name}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FormProvider {...methods}>
        <RNGFormProvider
          value={{
            formId,
            // Safe cast: UseFormReturn<Specific> -> UseFormReturn<Generic>
            // Required because RHF types are not covariant.
            methods: methods as unknown as UseFormReturn<FieldValues>,
          }}
        >
          <form
            // Pass our safe wrapper which handles the try/catch logic
            onSubmit={handleSubmit(handleSafeSubmit as unknown as SubmitHandler<z.infer<Schema>>)}
            noValidate
          >
            <Grid container spacing={2}>
              {/* Header */}
              {(title || description) && (
                <Grid size={12}>
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

              {/* Global Error (catches generic Errors and FormErrors without path) */}
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

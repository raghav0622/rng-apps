'use client';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormItem, FormSchema, WizardItem } from '../types';
import { FormBuilder } from './FormBuilder';

// Helper to collect all field names in a step to validate them
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFieldNames = (items: FormItem<any>[], prefix?: string): string[] => {
  let names: string[] = [];
  items.forEach((item) => {
    if (item.name) {
      names.push(prefix ? `${prefix}.${item.name}` : item.name);
    }
    // Recursive search for nested fields
    if (item.type === 'section' || item.type === 'tabs' || item.type === 'accordion') {
      // @ts-expect-error - dynamic children access
      const children =
        item.children ||
        item.tabs?.flatMap((t) => t.children) ||
        item.items?.flatMap((i) => i.children);
      if (children) {
        names = names.concat(getFieldNames(children, prefix));
      }
    }
  });
  return names;
};

export function RNGWizard<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: WizardItem<S>;
  pathPrefix?: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const {
    trigger,
    formState: { isSubmitting },
  } = useFormContext();
  const steps = item.steps;

  const handleNext = async () => {
    // 1. Identify fields in the current step
    const currentStepFields = getFieldNames(steps[activeStep].children, pathPrefix);

    // 2. Trigger validation ONLY for those fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await trigger(currentStepFields as any);

    if (isValid) {
      // 3. Move to next step if valid
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const isLastStep = activeStep === steps.length - 1;

  // --- NEW: Handle Enter Key Navigation ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only act on Enter key
    if (e.key !== 'Enter') return;

    // Ignore if holding Shift (e.g. for new lines in textareas)
    if (e.shiftKey) return;

    // Check what element triggered the event
    const target = e.target as HTMLElement;

    // Ignore textareas (RichText), buttons, or contentEditable elements
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'button'
    ) {
      return;
    }

    // Check if event was already handled (e.g., by Autocomplete selecting an option)
    if (e.defaultPrevented) return;

    if (!isLastStep) {
      // Prevent default form submission
      e.preventDefault();
      e.stopPropagation();

      // Navigate to next step
      handleNext();
    }
    // If it IS the last step, we let the event bubble.
    // Since the "Submit" button is present in the DOM, standard form behavior
    // will trigger a submit.
  };

  return (
    <Box sx={{ width: '100%' }} onKeyDown={handleKeyDown}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel
              optional={
                step.description ? (
                  <Typography variant="caption">{step.description}</Typography>
                ) : null
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <Box sx={{ py: 2 }}>
                <Grid container spacing={2}>
                  <FormBuilder uiSchema={step.children} pathPrefix={pathPrefix} />
                </Grid>
              </Box>
              <Box sx={{ mb: 2 }}>
                <div>
                  {isLastStep ? (
                    <Button
                      variant="contained"
                      type="submit" // Triggers form onSubmit
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={16} /> : <Check />}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      type="button" // Important: Prevent default submit
                      onClick={handleNext}
                      endIcon={<ArrowForward />}
                    >
                      Next
                    </Button>
                  )}

                  <Button
                    type="button" // Important: Prevent default submit
                    disabled={index === 0 || isSubmitting}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1, float: 'right' }}
                    startIcon={<ArrowBack />}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Box sx={{ p: 3 }}>
          <Typography>All steps completed.</Typography>
        </Box>
      )}
    </Box>
  );
}

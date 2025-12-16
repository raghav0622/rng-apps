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
    // 1. Add current item's name if it exists
    if (item.name) {
      names.push(prefix ? `${prefix}.${item.name}` : item.name);
    }

    // 2. Recursively find names in nested structures
    switch (item.type) {
      case 'section':
        if (item.children) {
          names = names.concat(getFieldNames(item.children, prefix));
        }
        break;

      case 'tabs':
        if (item.tabs) {
          item.tabs.forEach((tab) => {
            names = names.concat(getFieldNames(tab.children, prefix));
          });
        }
        break;

      case 'accordion':
        if (item.items) {
          item.items.forEach((accordionItem) => {
            names = names.concat(getFieldNames(accordionItem.children, prefix));
          });
        }
        break;

      // Note: We generally don't recurse into 'array' or 'wizard' inside a wizard step
      // because they have their own scopes/validation triggers,
      // but if needed, logic would go here.
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

  // --- Handle Enter Key Navigation ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (e.shiftKey) return; // Allow multiline in textareas

    const target = e.target as HTMLElement;

    // Ignore textareas, buttons, or explicitly interactive elements
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'button'
    ) {
      return;
    }

    if (e.defaultPrevented) return;

    if (!isLastStep) {
      e.preventDefault();
      e.stopPropagation();
      handleNext();
    }
    // If last step, let native submit happen
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
                      type="submit"
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={16} /> : <Check />}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      type="button"
                      onClick={handleNext}
                      endIcon={<ArrowForward />}
                    >
                      Next
                    </Button>
                  )}

                  <Button
                    type="button"
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

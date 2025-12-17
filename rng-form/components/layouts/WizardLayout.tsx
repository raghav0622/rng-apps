'use client';
import { getFieldNames } from '@/rng-form/utils';
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormSchema, WizardItem } from '../../types';
import { FormBuilder } from '../FormBuilder';

export function RNGWizardLayout<S extends FormSchema>({
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
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = async () => {
    const currentStepFields = getFieldNames(steps[activeStep].children, pathPrefix);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await trigger(currentStepFields as any);

    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // --- Handle Enter Key Navigation ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (e.shiftKey) return; // Allow multiline in textareas

    const target = e.target as HTMLElement;

    // Ignore textareas, buttons, or explicitly interactive elements
    // We want 'Enter' to submit/next only when in a standard input
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.isContentEditable ||
      target.getAttribute('role') === 'button'
    ) {
      return;
    }

    // Stop propagation to prevent double-submits or conflicts
    if (!isLastStep) {
      e.preventDefault();
      e.stopPropagation();
      handleNext();
    }
    // If last step, we let the event bubble so the <form> 'submit' event fires natively
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
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
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
                  startIcon={<ArrowBack />}
                  variant="outlined"
                >
                  Back
                </Button>
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

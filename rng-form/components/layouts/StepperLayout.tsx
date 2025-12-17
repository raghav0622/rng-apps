'use client';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';

interface RNGStepperLayoutProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'stepper' };
  // Stepper doesn't have children usually, it's a visualizer, so pathPrefix might not be used, but good to have for standard signature
  pathPrefix?: string;
}

export function RNGStepperLayout<S extends FormSchema>({ item }: RNGStepperLayoutProps<S>) {
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper activeStep={item.activeStepIndex ?? 0} alternativeLabel>
        {item.steps.map((step, index) => (
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
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

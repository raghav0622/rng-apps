'use client';
import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { FormSchema, StepperItem } from '../../types';

export function RNGStepperLayout<S extends FormSchema>({ item }: { item: StepperItem<S> }) {
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

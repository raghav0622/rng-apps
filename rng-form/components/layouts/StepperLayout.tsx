'use client';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Box, Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';

interface RNGStepperLayoutProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'stepper' };
  pathPrefix?: string;
}

export function RNGStepperLayout<S extends FormSchema>({ item }: RNGStepperLayoutProps<S>) {
  return (
    <Grid size={item.colProps?.size ?? 12} {...item.colProps}>
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
    </Grid>
  );
}

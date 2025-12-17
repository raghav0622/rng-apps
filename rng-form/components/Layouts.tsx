'use client';
import { Close, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState } from 'react';
import { AccordionItem, FormSchema, ModalFormItem, StepperItem, TabsItem } from '../types';
import { FormBuilder } from './FormBuilder';

// --- TABS LAYOUT ---
export function RNGTabsLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: TabsItem<S>;
  pathPrefix?: string;
}) {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          {item.tabs.map((tab, index) => (
            <Tab label={tab.label} key={index} />
          ))}
        </Tabs>
      </Box>
      {item.tabs.map((tab, index) => (
        <div
          role="tabpanel"
          hidden={value !== index}
          key={index}
          style={{ paddingTop: 20, paddingBottom: 10 }}
        >
          {value === index && (
            <Grid container spacing={2}>
              <FormBuilder uiSchema={tab.children} pathPrefix={pathPrefix} />
            </Grid>
          )}
        </div>
      ))}
    </Box>
  );
}

// --- ACCORDION LAYOUT ---
export function RNGAccordionLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: AccordionItem<S>;
  pathPrefix?: string;
}) {
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {item.items.map((accordionItem, index) => (
        <Accordion key={index} defaultExpanded={accordionItem.defaultExpanded}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1" fontWeight={500}>
              {accordionItem.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <FormBuilder uiSchema={accordionItem.children} pathPrefix={pathPrefix} />
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

// --- STEPPER (DISPLAY ONLY) ---
export function RNGStepperDisplay<S extends FormSchema>({ item }: { item: StepperItem<S> }) {
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

// --- MODAL FORM WRAPPER ---
export function RNGModalForm<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: ModalFormItem<S>;
  pathPrefix?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {item.triggerLabel}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {item.dialogTitle || item.triggerLabel}
          <IconButton onClick={() => setOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}

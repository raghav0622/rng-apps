'use client';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { AccordionItem, FormSchema } from '../../types';
import { FormBuilder } from '../FormBuilder';

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
          <AccordionSummary expandIcon={<ExpandMore />} id={`accordion-header-${index}`}>
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

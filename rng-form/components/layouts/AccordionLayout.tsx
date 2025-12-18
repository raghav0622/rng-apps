'use client';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';

interface RNGAccordionLayoutProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'accordion' };
  pathPrefix?: string;
}

export function RNGAccordionLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: RNGAccordionLayoutProps<S>) {
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
            {/* REFACTOR: Direct FormBuilder rendering to prevent layout overflow */}
            <FormBuilder uiSchema={accordionItem.children} pathPrefix={pathPrefix} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

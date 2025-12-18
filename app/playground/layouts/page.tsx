'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const schema = z.object({
  company: z.string(),
  address: z.string(),
  department: z.string(),
  notes: z.string().optional(),
});

const uiSchema = defineForm<typeof schema>((f) => [
  f.wizard([
    {
      label: 'Company Details',
      children: [f.text('company', { label: 'Company Name' })],
    },
    {
      label: 'Location',
      children: [f.text('address', { label: 'Full Address' })],
    },
    {
      label: 'Review',
      children: [
        f.text('department', { label: 'Department' }),
        f.section('Additional Info', [f.text('notes', { label: 'Notes', multiline: true })]),
      ],
    },
  ]),
]);

export default function LayoutsPage() {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Wizard Layout
      </Typography>
      <Paper sx={{ p: 4 }}>
        <RNGForm
          schema={schema}
          uiSchema={uiSchema}
          onSubmit={(data) => logInfo('Layout Submit', data)}
          hideSubmitButton // Wizard has its own buttons
        />
      </Paper>
    </Box>
  );
}

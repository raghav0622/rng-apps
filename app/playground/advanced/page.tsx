'use client';

import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// 1. Schema
const schema = z.object({
  // Dates
  appointmentDate: z.date(),
  vacationRange: z.object({ start: z.date().nullable(), end: z.date().nullable() }),

  // Selection
  color: z.string(),
  satisfaction: z.number().min(1).max(5),
  volume: z.number().min(0).max(100),
  interests: z.array(z.string()), // Transfer list returns strings

  // Advanced
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),

  files: z.any().optional(), // File upload
  signature: z.string().optional(),

  // Autocomplete
  // FIX: Autocomplete returns the full option object { label, value }, not just string.
  // We also handle nullable() because clearing the input sets it to null.
  country: z
    .object({ label: z.string(), value: z.string() })
    .nullable()
    // Optional: Add refinement if you want to force selection
    .refine((val) => val !== null, { message: 'Country is required' }),
});

// 2. UI
const ui = defineForm<typeof schema>((f) => [
  f.tabs([
    {
      label: 'Dates & Visuals',
      children: [
        f.date('appointmentDate', { label: 'Appointment Date' }),
        f.dateRange('vacationRange', { label: 'Vacation Period' }),
        f.section('Visual Inputs', [
          f.color('color', { label: 'Brand Color' }),
          f.rating('satisfaction', { label: 'Customer Satisfaction', max: 5 }),
          f.slider('volume', { label: 'Volume Control', min: 0, max: 100, step: 5 }),
        ]),
      ],
    },
    {
      label: 'Complex Data',
      children: [
        f.autocomplete(
          'country',
          [
            { label: 'India', value: 'IN' },
            { label: 'USA', value: 'US' },
            { label: 'Canada', value: 'CA' },
          ],
          { label: 'Select Country' },
        ),
        f.transferList(
          'interests',
          [
            { label: 'Coding', value: 'coding' },
            { label: 'Design', value: 'design' },
            { label: 'Music', value: 'music' },
            { label: 'Gaming', value: 'gaming' },
          ],
          { label: 'Select Interests' },
        ),
        f.file('files', { label: 'Attach Documents', multiple: true }),
        f.location('location', { label: 'Shipping Address' }),
      ],
    },
    {
      label: 'Sign Off',
      children: [f.signature('signature', { label: 'Digital Signature', height: 200 })],
    },
  ]),
]);

export default function AdvancedInputsPage() {
  const [data, setData] = useState<object | null>(null);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Advanced Inputs Playground
      </Typography>
      <RNGForm
        schema={schema}
        uiSchema={ui}
        defaultValues={{
          appointmentDate: new Date(),
          color: '#1976d2',
          satisfaction: 3,
          volume: 50,
          interests: [],
        }}
        onSubmit={setData}
      />
      {data && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
}

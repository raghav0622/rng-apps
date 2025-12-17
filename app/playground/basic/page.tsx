'use client';

import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  price: z.coerce.number().min(0),
  quantity: z.coerce.number().min(1),
  total: z.coerce.number().optional(),
});

const ui = defineForm<typeof schema>((f) => [
  f.section('Personal Info', [
    f.text('firstName', { label: 'First Name', colProps: { size: { xs: 12, md: 6 } } }),
    f.text('lastName', { label: 'Last Name', colProps: { size: { xs: 12, md: 6 } } }),
    f.masked('phone', '(000) 000-0000', {
      label: 'Phone Number',
      placeholder: '(555) 555-5555',
    }),
  ]),
  f.section('Order Calculation (Real-time)', [
    f.currency('price', { label: 'Unit Price ($)', colProps: { size: { xs: 12, md: 4 } } }),
    f.number('quantity', { label: 'Quantity', colProps: { size: { xs: 12, md: 4 } } }),
    f.calculated(
      'total',
      (values) => {
        const p = Number(values.price) || 0;
        const q = Number(values.quantity) || 0;
        return (p * q).toFixed(2);
      },
      {
        label: 'Total (Calculated)',
        dependencies: ['price', 'quantity'],
        colProps: { size: { xs: 12, md: 4 } },
      },
    ),
  ]),
]);

export default function BasicInputsPage() {
  const [data, setData] = useState<object | null>(null);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Basic Inputs & Calculations
      </Typography>
      <RNGForm
        schema={schema}
        uiSchema={ui}
        defaultValues={{ price: 10, quantity: 1 }}
        onSubmit={setData}
        submitLabel="Submit Order"
      />
      {data && (
        <Paper sx={{ p: 2 }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
}

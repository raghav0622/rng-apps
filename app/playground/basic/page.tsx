'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const schema = z.object({
  price: z.number().default(0),
  quantity: z.number().default(1),
  totla: z.coerce.number().default(0),
});

const uiSchema = defineForm<typeof schema>((f) => [
  f.number('price', { label: 'Price' }),
  f.number('quantity', { label: 'Quantity' }),
  f.calculated('totla', {
    label: 'Total',
    calculate(values) {
      return values.price * values.quantity;
    },
  }),
]);

export default function BasicPage() {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Basic Inputs
      </Typography>
      <Paper sx={{ p: 4 }}>
        <RNGForm
          schema={schema}
          uiSchema={uiSchema}
          defaultValues={{
            price: 1000,
            quantity: 200,
            totla: 0,
          }}
          onSubmit={(data) => logInfo('Basic Submit', data)}
          submitLabel="Submit"
        />
      </Paper>
    </Box>
  );
}

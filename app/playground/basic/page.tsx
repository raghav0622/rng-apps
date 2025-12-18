'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const schema = z.object({
  fullName: z.string().min(2, 'Name too short'),
  email: z.string().email(),
  age: z.number().min(18),
  bio: z.string().optional(),
  preferences: z.enum(['dark', 'light']),
  subscribe: z.boolean(),
});

const uiSchema = defineForm<typeof schema>((f) => [
  f.text('fullName', { label: 'Full Name', placeholder: 'John Doe', colProps: { size: 6 } }),
  f.text('email', { label: 'Email Address', colProps: { size: 6 } }),
  f.number('age', { label: 'Age' }),
  f.autocomplete('preferences', ['dark', 'light'], { label: 'Theme Preference' }),
  f.text('bio', { label: 'Bio', multiline: true, rows: 3 }),
  f.switch('subscribe', { label: 'Subscribe to newsletter' }),
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
          onSubmit={(data) => logInfo('Basic Submit', data)}
          submitLabel="Create User"
        />
      </Paper>
    </Box>
  );
}

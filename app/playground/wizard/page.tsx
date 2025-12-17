'use client';

import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  plan: z.string(),
  // Ensure default logic or required messages are clear
  agree: z.boolean().refine((val) => val === true, { message: 'You must agree to the terms' }),
});

const ui = defineForm<typeof schema>((f) => [
  f.wizard([
    {
      label: 'Account',
      description: 'Setup your profile',
      children: [
        f.text('username', { label: 'Username' }),
        f.text('email', { label: 'Email Address' }),
      ],
    },
    {
      label: 'Subscription',
      description: 'Choose a plan',
      children: [
        f.radio(
          'plan',
          [
            { label: 'Free Tier', value: 'free' },
            { label: 'Pro ($10/mo)', value: 'pro' },
            { label: 'Enterprise', value: 'ent' },
          ],
          { label: 'Select a Plan' },
        ),
      ],
    },
    {
      label: 'Terms',
      children: [
        f.section('Terms & Conditions', [
          f.switch('agree', { label: 'I agree to the terms and conditions' }),
        ]),
      ],
    },
  ]),
]);

export default function WizardPage() {
  const [data, setData] = useState<object | null>(null);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Multi-Step Wizard
      </Typography>
      <RNGForm
        schema={schema}
        uiSchema={ui}
        defaultValues={{ plan: 'free' }}
        onSubmit={setData}
        // IMPORTANT: Hide the global submit button so only the Wizard's submit button is used
        hideSubmitButton={true}
      />
      {data && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Form Submitted:</Typography>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
}

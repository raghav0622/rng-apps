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
  paymentMethod: z.string(),
  agree: z.boolean().refine((val) => val === true, 'You must agree'),
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
      <RNGForm schema={schema} uiSchema={ui} defaultValues={{ plan: 'free' }} onSubmit={setData} />
      {data && (
        <Paper sx={{ p: 2 }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
}

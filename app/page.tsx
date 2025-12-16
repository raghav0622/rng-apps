/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { RNGForm } from '@/rng-form';
import { zUtils } from '@/rng-form/utils';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// --- SCHEMA ---
const WizardSchema = z.object({
  // Step 1: Account
  username: zUtils.string,
  password: zUtils.password,

  // Step 2: Details
  firstName: zUtils.string,
  lastName: zUtils.string,
  email: z.string().email(),

  // Step 3: Location (Cascading)
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),

  // Step 4: Review
  terms: z.boolean().refine((val) => val === true, 'Must accept terms'),
});

type FormValues = z.infer<typeof WizardSchema>;

const CITIES: Record<string, string[]> = {
  USA: ['New York', 'Los Angeles', 'Chicago'],
  India: ['Mumbai', 'Delhi', 'Bangalore'],
  UK: ['London', 'Manchester'],
};

export default function WizardPage() {
  const [result, setResult] = useState<any>(null);

  // Mock API with delay to test Debounce
  const fetchCities = async (query: string, values: any) => {
    console.log('Fetching cities for:', query); // Check console to verify debounce
    await new Promise((r) => setTimeout(r, 800)); // Slow API

    const country = values.country;
    if (!country || !CITIES[country]) return [];

    return CITIES[country].filter((c) => c.toLowerCase().includes(query.toLowerCase()));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        RNG Form Wizard
      </Typography>
      <Typography sx={{ mb: 3, color: 'text.secondary' }}>
        Multi-step wizard with validation guarding each step.
      </Typography>

      <Paper sx={{ p: 4 }}>
        <RNGForm
          schema={WizardSchema}
          persistKey="test-form"
          title="Registration Wizard"
          hideFooter={true} // IMPORTANT: Hide default submit button
          defaultValues={{
            username: '',
            password: '',
            firstName: '',
            lastName: '',
            email: '',
            country: '',
            city: '',
            terms: false,
          }}
          onSubmit={(v) => setResult(v)}
          uiSchema={[
            {
              type: 'wizard',
              steps: [
                {
                  label: 'Account Setup',
                  description: 'Create your credentials',
                  children: [
                    { type: 'text', name: 'username', label: 'Username', colProps: { size: 6 } },
                    {
                      type: 'password',
                      name: 'password',
                      label: 'Password',
                      colProps: { size: 6 },
                    },
                  ],
                },
                {
                  label: 'Personal Info',
                  children: [
                    { type: 'text', name: 'firstName', label: 'First Name', colProps: { size: 6 } },
                    { type: 'text', name: 'lastName', label: 'Last Name', colProps: { size: 6 } },
                    { type: 'text', name: 'email', label: 'Email Address', colProps: { size: 12 } },
                  ],
                },
                {
                  label: 'Location',
                  children: [
                    {
                      type: 'autocomplete',
                      name: 'country',
                      label: 'Country',
                      options: ['USA', 'India', 'UK'],
                      colProps: { size: 12 },
                    },
                    {
                      type: 'async-autocomplete',
                      name: 'city',
                      label: 'City (Async + Cascading)',
                      loadOptions: fetchCities,
                      dependencies: ['country'],
                      colProps: { size: 12 },
                    },
                  ],
                },
                {
                  label: 'Review & Submit',
                  children: [
                    { type: 'switch', name: 'terms', label: 'I agree to the terms and conditions' },
                  ],
                },
              ],
            },
          ]}
        />

        {result && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
            <Typography variant="h6">Success!</Typography>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

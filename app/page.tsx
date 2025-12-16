// app/page.tsx
'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { zUtils } from '@/rng-form/utils';
import { Alert, Box, Container, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// --- 1. Define Schema with Conditional Logic ---
const KitchenSinkSchema = z
  .object({
    // Identity
    fullName: zUtils.string,
    email: z.string().email('Invalid email address'),
    password: zUtils.password,

    // Numbers (Allow null/undefined for empty initial state)
    age: z.number({ error: 'Age is required' }).min(18, 'Must be 18+'),
    salary: z.number({ error: 'Salary is required' }).min(10000, 'Minimum salary is ₹10,000'),

    // Dates
    joiningDate: zUtils.date,

    // Dropdowns
    department: z.string().min(1, 'Department is required'),

    // Logic Triggers
    isDeveloper: z.boolean(),

    // Dependent Fields (Initially optional to pass base validation)
    githubProfile: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    techStack: z.array(z.string()).optional(),

    // Hidden
    source: z.string(),
  })
  .superRefine((data, ctx) => {
    // CRITICAL FIX: Only validate these fields if isDeveloper is TRUE
    if (data.isDeveloper) {
      if (!data.techStack || data.techStack.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select at least one technology',
          path: ['techStack'],
        });
      }
      if (!data.githubProfile || data.githubProfile.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GitHub profile is required for developers',
          path: ['githubProfile'],
        });
      }
    }
  });

// --- 2. Constants ---
const DEPARTMENTS = ['Engineering', 'HR', 'Sales', 'Marketing', 'Product'];
const TECH_STACK = ['React', 'Next.js', 'Node.js', 'Python', 'Go', 'Rust', 'Docker'];

export default function KitchenSinkPage() {
  const [submittedData, setSubmittedData] = useState<null | object>(null);

  return (
    <Container maxWidth="md">
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper' }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            RNG Form Playground
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Testing Inputs, Validation, and Conditional Logic
          </Typography>
        </Box>
        {/* --- Results Section --- */}
        {submittedData && (
          <Box sx={{ mt: 5, borderTop: '1px solid #eee', pt: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Validation Passed & Data Captured!
            </Alert>
            <Typography variant="subtitle2" gutterBottom>
              Submitted JSON:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: '#1E1E1E',
                color: '#A9B7C6',
                borderRadius: 2,
                overflowX: 'auto',
                fontSize: '0.85rem',
                fontFamily: 'Consolas, monospace',
              }}
            >
              {JSON.stringify(submittedData, null, 2)}
            </Box>
          </Box>
        )}

        <RNGForm
          title="Employee Onboarding"
          description="Complete the form below to test all component types."
          submitLabel="Run Test Submission"
          // FIX: "Clean Slate" default values
          defaultValues={{
            fullName: '',
            email: '',
            password: '',
            age: undefined,
            salary: undefined,
            isDeveloper: false,
            githubProfile: '',
            yearsOfExperience: undefined,
            techStack: [],
            // @ts-expect-error: Allowing null for empty date
            joiningDate: null,
            department: '',
            source: 'kitchen-sink-v2',
          }}
          schema={KitchenSinkSchema}
          onSubmit={async (values) => {
            // Simulate API Latency
            await new Promise((resolve) => setTimeout(resolve, 1500));
            logInfo('Form Submitted:', values);
            setSubmittedData(values);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
          uiSchema={[
            // --- Row 1: Basic Info ---
            {
              type: 'text',
              name: 'fullName',
              label: 'Full Name',
              colProps: { size: { xs: 12, md: 6 } },
            },
            {
              type: 'number',
              name: 'age',
              label: 'Age',
              colProps: { size: { xs: 12, md: 6 } },
            },

            // --- Row 2: Account ---
            {
              type: 'text',
              name: 'email',
              label: 'Work Email',
              colProps: { size: { xs: 12, md: 6 } },
            },
            {
              type: 'password',
              name: 'password',
              label: 'Password',
              description: 'Min 6 chars',
              colProps: { size: { xs: 12, md: 6 } },
            },

            // --- Row 3: Compensation & Role ---
            {
              type: 'currency',
              name: 'salary',
              label: 'Annual CTC',
              colProps: { size: { xs: 12, md: 6 } },
            },
            {
              type: 'autocomplete',
              name: 'department',
              label: 'Department',
              options: DEPARTMENTS,
              colProps: { size: { xs: 12, md: 6 } },
            },

            // --- Row 4: Dates ---
            {
              type: 'date',
              name: 'joiningDate',
              label: 'Date of Joining',
              colProps: { size: { xs: 12 } },
            },

            // --- Row 5: Logic Switch ---
            {
              type: 'switch',
              name: 'isDeveloper',
              label: 'Is this an Engineering role?',
              colProps: { size: { xs: 12 } },
            },

            // --- Conditional Fields (Only visible if isDeveloper === true) ---
            {
              type: 'text',
              name: 'githubProfile',
              label: 'GitHub Username',
              colProps: { size: { xs: 12, md: 6 } },
              renderLogic: (values) => !!values.isDeveloper,
            },
            {
              type: 'number',
              name: 'yearsOfExperience',
              label: 'Years of Exp.',
              colProps: { size: { xs: 12, md: 6 } },
              renderLogic: (values) => !!values.isDeveloper,
            },
            {
              type: 'autocomplete',
              name: 'techStack',
              label: 'Tech Stack (Multi-select)',
              multiple: true,
              options: TECH_STACK,
              colProps: { size: { xs: 12, md: 6 } },
              renderLogic: (values) => !!values.isDeveloper,
            },

            // --- Hidden ---
            {
              type: 'hidden',
              name: 'source',
              label: '',
            },
          ]}
        />
      </Paper>
    </Container>
  );
}

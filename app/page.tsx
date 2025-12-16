'use client';

import { RNGForm } from '@/rng-form';
import { zUtils } from '@/rng-form/utils';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// --- Schema Definition ---

const ExperienceSchema = z.object({
  company: zUtils.string,
  role: zUtils.string,
  description: z.string().optional(), // For Rich Text
});

const AdvancedFormSchema = z.object({
  // Section 1: Basic
  firstName: zUtils.string,
  lastName: zUtils.string,

  // Section 2: Async Data
  manager: z.object({ id: z.string(), label: z.string() }).nullable(), // Async result object

  // Section 3: History (Array)
  workHistory: z.array(ExperienceSchema).min(1, 'Add at least one job experience'),

  // Section 4: Formatting
  coverLetter: z.string().min(20, 'Cover letter must be at least 20 chars'),
});

// --- Mock Async Loader ---
const mockFetchManagers = async (query: string) => {
  await new Promise((r) => setTimeout(r, 800)); // Simulate lag
  const allManagers = [
    { id: '1', label: 'Alice Johnson' },
    { id: '2', label: 'Bob Smith' },
    { id: '3', label: 'Charlie Brown' },
    { id: '4', label: 'David Williams' },
  ];
  if (!query) return allManagers;
  return allManagers.filter((m) => m.label.toLowerCase().includes(query.toLowerCase()));
};

export default function AdvancedPage() {
  const [submittedData, setSubmittedData] = useState<null | object>(null);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            Advanced RNG Form
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Testing Sections, Arrays, Async & Rich Text
          </Typography>
        </Box>

        <RNGForm
          schema={AdvancedFormSchema}
          title="Candidate Application"
          defaultValues={{
            firstName: '',
            lastName: '',
            manager: null,
            workHistory: [{ company: '', role: '', description: '<p>Initial content...</p>' }],
            coverLetter: '',
          }}
          onSubmit={(values) => {
            setSubmittedData(values);
          }}
          uiSchema={[
            {
              type: 'section',
              title: 'Personal Information',
              children: [
                {
                  type: 'text',
                  name: 'firstName',
                  label: 'First Name',
                  colProps: { size: { xs: 12, md: 6 } },
                },
                {
                  type: 'text',
                  name: 'lastName',
                  label: 'Last Name',
                  colProps: { size: { xs: 12, md: 6 } },
                },
              ],
            },
            {
              type: 'section',
              title: 'Referral Details',
              children: [
                {
                  type: 'async-autocomplete',
                  name: 'manager',
                  label: 'Referring Manager (Search...)',
                  loadOptions: mockFetchManagers,
                  colProps: { size: 12 },
                },
              ],
            },
            {
              type: 'section',
              title: 'Professional Experience',
              children: [
                {
                  type: 'array',
                  name: 'workHistory',
                  label: 'Past Employment',
                  itemLabel: 'Add Job',
                  items: [
                    {
                      type: 'text',
                      name: 'company',
                      label: 'Company Name',
                      colProps: { size: { xs: 12, md: 6 } },
                    },
                    {
                      type: 'text',
                      name: 'role',
                      label: 'Job Title',
                      colProps: { size: { xs: 12, md: 6 } },
                    },
                    {
                      type: 'rich-text',
                      name: 'description',
                      label: 'Job Responsibilities',
                    },
                  ],
                },
              ],
            },
            {
              type: 'section',
              title: 'Additional Info',
              children: [
                {
                  type: 'rich-text',
                  name: 'coverLetter',
                  label: 'Cover Letter',
                  minHeight: 200,
                },
              ],
            },
          ]}
        />

        {submittedData && (
          <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <pre>{JSON.stringify(submittedData, null, 2)}</pre>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

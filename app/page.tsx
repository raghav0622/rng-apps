/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { zUtils } from '@/rng-form/utils';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// --- MOCK ASYNC DATA ---
const mockSkills = [
  { id: '1', label: 'React' },
  { id: '2', label: 'Node.js' },
  { id: '3', label: 'TypeScript' },
  { id: '4', label: 'Python' },
  { id: '5', label: 'Go' },
];

const mockFetchSkills = async (query: string) => {
  await new Promise((r) => setTimeout(r, 500));
  if (!query) return mockSkills;
  return mockSkills.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));
};

// --- SCHEMA DEFINITION ---
const KitchenSinkSchema = z.object({
  // 1. Text & Password
  username: zUtils.string,
  password: zUtils.password,

  // 2. Numbers & Ranges
  age: zUtils.number.min(18, 'Must be 18+'),
  salary: zUtils.number.min(0),
  experience: z.number().min(0).max(10), // Slider

  // 3. Selectors & Groups
  role: z.string().min(1, 'Required'), // Radio
  interests: z.array(z.string()).min(1, 'Pick at least one'), // Checkbox Group
  department: z.string().min(1, 'Required'), // Autocomplete

  // 4. Date
  joinDate: zUtils.date,

  // 5. Logic
  hasReferral: z.boolean(),
  referralCode: z.string().optional(),

  // 6. Advanced
  skills: z.array(z.object({ id: z.string(), label: z.string() })).min(1, 'Pick one'), // Async
  resume: z.any().optional(), // File (Typed as any for browser File object)
  rating: z.number().min(1).optional(), // Star Rating

  // 7. Rich Text
  bio: z.string().min(10, 'Bio too short'),

  // 8. Arrays
  education: z.array(
    z.object({
      school: zUtils.string,
      degree: zUtils.string,
      year: zUtils.number,
    }),
  ),
});

type FormValues = z.infer<typeof KitchenSinkSchema>;

export default function KitchenSinkPage() {
  const [result, setResult] = useState<any>(null);

  const handleSubmit = (values: FormValues) => {
    // Note: File objects won't show nicely in JSON.stringify
    logInfo('Submitted:', values);
    setResult(values);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        RNG Form Kitchen Sink
      </Typography>
      <Typography sx={{ mb: 3, color: 'text.secondary' }}>
        Testing all input types, validation, conditional logic, and layout.
      </Typography>

      <Paper sx={{ p: 4 }}>
        <RNGForm
          schema={KitchenSinkSchema}
          title="Employee Onboarding"
          defaultValues={{
            username: '',
            password: '',
            age: undefined as any,
            salary: undefined as any,
            experience: 5,
            role: '',
            interests: [],
            department: '',
            joinDate: null as any,
            hasReferral: false,
            referralCode: '',
            skills: [],
            rating: 4,
            bio: '<p>Write about yourself...</p>',
            education: [],
            resume: null,
          }}
          onSubmit={handleSubmit}
          uiSchema={[
            // SECTION: Account
            {
              type: 'section',
              title: 'Account Details',
              children: [
                {
                  type: 'text',
                  name: 'username',
                  label: 'Username',
                  colProps: { size: { xs: 12, md: 6 } },
                },
                {
                  type: 'password',
                  name: 'password',
                  label: 'Password',
                  colProps: { size: { xs: 12, md: 6 } },
                },
              ],
            },

            // SECTION: Stats & Sliders
            {
              type: 'section',
              title: 'Personal Stats',
              children: [
                {
                  type: 'number',
                  name: 'age',
                  label: 'Age',
                  colProps: { size: { xs: 6, md: 3 } },
                },
                {
                  type: 'currency',
                  name: 'salary',
                  label: 'Expected Salary',
                  colProps: { size: { xs: 6, md: 3 } },
                },
                {
                  type: 'slider',
                  name: 'experience',
                  label: 'Years of Experience (Slider)',
                  min: 0,
                  max: 10,
                  colProps: { size: { xs: 12, md: 6 } },
                },
              ],
            },

            // SECTION: Choices
            {
              type: 'section',
              title: 'Role & Interests',
              children: [
                {
                  type: 'radio',
                  name: 'role',
                  label: 'Primary Role',
                  row: true,
                  options: [
                    { label: 'Developer', value: 'dev' },
                    { label: 'Designer', value: 'des' },
                    { label: 'Manager', value: 'mgr' },
                  ],
                  colProps: { size: 12 },
                },
                {
                  type: 'checkbox-group',
                  name: 'interests',
                  label: 'Areas of Interest',
                  row: true,
                  options: [
                    { label: 'Frontend', value: 'fe' },
                    { label: 'Backend', value: 'be' },
                    { label: 'DevOps', value: 'ops' },
                  ],
                  colProps: { size: 12 },
                },
              ],
            },

            // SECTION: Professional
            {
              type: 'section',
              title: 'Professional Info',
              children: [
                {
                  type: 'autocomplete',
                  name: 'department',
                  label: 'Department',
                  options: ['Engineering', 'HR', 'Sales', 'Marketing'],
                  colProps: { size: { xs: 12, md: 6 } },
                },
                {
                  type: 'async-autocomplete',
                  name: 'skills',
                  label: 'Skills (Async Search)',
                  multiple: true,
                  loadOptions: mockFetchSkills,
                  colProps: { size: { xs: 12, md: 6 } },
                },
                {
                  type: 'date',
                  name: 'joinDate',
                  label: 'Joining Date',
                  colProps: { size: { xs: 12, md: 6 } },
                },
                {
                  type: 'file',
                  name: 'resume',
                  label: 'Upload Resume (PDF)',
                  accept: '.pdf,.doc,.docx',
                  colProps: { size: { xs: 12, md: 6 } },
                },
              ],
            },

            // SECTION: Feedback
            {
              type: 'section',
              title: 'Self Evaluation',
              children: [
                {
                  type: 'rating',
                  name: 'rating',
                  label: 'How do you rate your coding skills?',
                  max: 5,
                  colProps: { size: 12 },
                },
                {
                  type: 'rich-text',
                  name: 'bio',
                  label: 'Biography',
                  minHeight: 150,
                },
              ],
            },

            // SECTION: Logic
            {
              type: 'section',
              title: 'Referral (Conditional Logic)',
              children: [
                {
                  type: 'switch',
                  name: 'hasReferral',
                  label: 'Do you have a referral?',
                },
                {
                  type: 'text',
                  name: 'referralCode',
                  label: 'Referral Code',
                  renderLogic: (values) => !!values.hasReferral,
                  dependencies: ['hasReferral'],
                },
              ],
            },

            // SECTION: Array
            {
              type: 'section',
              title: 'Education History',
              children: [
                {
                  type: 'array',
                  name: 'education',
                  label: 'Schools Attended',
                  itemLabel: 'Add School',
                  defaultValue: { school: '', degree: '', year: 2020 },
                  items: [
                    {
                      type: 'text',
                      name: 'school',
                      label: 'School Name',
                      colProps: { size: 6 },
                    },
                    {
                      type: 'text',
                      name: 'degree',
                      label: 'Degree',
                      colProps: { size: 3 },
                    },
                    {
                      type: 'number',
                      name: 'year',
                      label: 'Year',
                      colProps: { size: 3 },
                    },
                  ],
                },
              ],
            },
          ]}
        />

        {result && (
          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="h6">Form Output:</Typography>
            <pre style={{ overflowX: 'auto' }}>
              {JSON.stringify(
                result,
                (key, value) => {
                  if (typeof File !== 'undefined' && value instanceof File) {
                    return `File: ${value.name}`;
                  }
                  if (typeof FileList !== 'undefined' && value instanceof FileList) {
                    return `FileList: ${value.length} files`;
                  }
                  return value;
                },
                2,
              )}
            </pre>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

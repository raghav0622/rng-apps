'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { FormItem } from '@/rng-form/types';
import { Box, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['developer', 'designer', 'manager']),
  experience: z.number().min(0),
  // Logic dependent fields
  portfolioUrl: z.string().url().optional(),
  managementExperience: z.string().optional(),
  // File Upload
  resume: z.any().optional(),
  // Array
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.string(),
      }),
    )
    .optional(),
});

type FormType = typeof schema;

const uiSchema: FormItem<FormType>[] = [
  {
    type: 'section',
    title: 'Personal Information',
    children: [
      { type: 'text', name: 'firstName', label: 'First Name', colProps: { size: 6 } },
      { type: 'text', name: 'lastName', label: 'Last Name', colProps: { size: 6 } },
      {
        type: 'autocomplete',
        name: 'role',
        label: 'Job Role',
        options: ['developer', 'designer', 'manager'],
        colProps: { size: 6 },
      },
      {
        type: 'number',
        name: 'experience',
        label: 'Years of Experience',
        colProps: { size: 6 },
      },
    ],
  },
  {
    type: 'section',
    title: 'Role Specifics (Logic Demo)',
    children: [
      {
        type: 'text',
        name: 'portfolioUrl',
        label: 'Portfolio URL',
        dependencies: ['role'],
        renderLogic: (values) => values.role === 'designer',
      },
      {
        type: 'text',
        name: 'managementExperience',
        label: 'Management Details',
        multiline: true,
        dependencies: ['role'],
        renderLogic: (values) => values.role === 'manager',
      },
    ],
  },
  {
    type: 'section',
    title: 'Documents',
    children: [
      {
        type: 'file',
        name: 'resume',
        label: 'Upload Resume',
        accept: '.pdf,.doc,.docx',
        description: 'Max 5MB',
      },
    ],
  },
  {
    type: 'data-grid',
    name: 'skills',
    columns: [
      { header: 'Skill Name', field: { type: 'text', name: 'name', label: 'Skill' } },
      {
        header: 'Level',
        field: {
          type: 'autocomplete',
          name: 'level',
          label: 'Level',
          options: ['Beginner', 'Intermediate', 'Expert'],
        },
      },
    ],
    defaultValue: { name: '', level: 'Beginner' },
  },
];

export default function NewFormPlayground() {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        RNG Form
      </Typography>
      <Paper sx={{ p: 4 }}>
        <RNGForm
          schema={schema}
          uiSchema={uiSchema}
          onSubmit={(data) => logInfo('Form Data:', data)}
          title="Developer Profile"
          titleProps={{ textAlign: 'center' }}
        />
      </Paper>
    </Box>
  );
}

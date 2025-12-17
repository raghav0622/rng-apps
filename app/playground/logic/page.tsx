'use client';

import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// 1. Schema Definition
// -----------------------------------------------------------------------------
const skillItemSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.string(),
});

const schema = z.object({
  hasjob: z.boolean(),
  company: z.string().optional(),
  role: z.string().optional(),
  // Array of objects
  skills: z.array(skillItemSchema),
});

// 2. UI Definition
// -----------------------------------------------------------------------------

// Sub-form for the array items
const skillsUi = defineForm<typeof skillItemSchema>((s) => [
  s.text('name', { label: 'Skill Name', colProps: { size: { xs: 8 } } }),
  s.text('level', { label: 'Level (1-10)', colProps: { size: { xs: 4 } } }),
]);

const ui = defineForm<typeof schema>((f) => [
  f.section('Employment Information', [
    f.switch('hasjob', { label: 'Do you have a job?' }),

    // LOGIC: Only show 'company' if 'hasjob' is true
    f.text('company', {
      label: 'Company Name',
      renderLogic: (v) => !!v.hasjob,
    }),

    // LOGIC: Show if 'hasjob' is true, AND update label based on 'company' value
    f.text('role', {
      label: 'Job Role',
      renderLogic: (v) => !!v.hasjob,
      propsLogic: (v) => ({
        label: v.company ? `Role at ${v.company}` : 'Job Role',
      }),
      // Important: Declare dependencies so the field re-renders when 'company' changes
      dependencies: ['company'],
    }),
  ]),

  f.section('Skills (Drag & Drop)', [
    f.array('skills', skillsUi, {
      label: 'Skills',
      itemLabel: 'Add New Skill',
      description: 'List your top skills here. Drag items to reorder.',
    }),
  ]),
]);

// 3. Page Component
// -----------------------------------------------------------------------------
export default function LogicPage() {
  const [data, setData] = useState<object | null>(null);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Conditional Logic & Arrays
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Toggle the switch to see fields appear. Type in &quot;Company Name&quot; to see the
        &quot;Job Role&quot; label update dynamically.
      </Typography>

      <RNGForm
        schema={schema}
        uiSchema={ui}
        defaultValues={{ hasjob: false, skills: [{ name: 'React', level: '10' }] }}
        onSubmit={setData}
        title="Logic Form"
      />

      {data && (
        <Paper sx={{ p: 2 }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
}

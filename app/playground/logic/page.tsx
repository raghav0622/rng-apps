'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const schema = z.object({
  role: z.enum(['user', 'admin', 'guest']),
  adminCode: z.string().optional(),
  notifications: z.boolean(),
  emailFrequency: z.enum(['daily', 'weekly']).optional(),
});

const uiSchema = defineForm<typeof schema>((f) => [
  f.section('User Permissions', [
    f.autocomplete('role', ['user', 'admin', 'guest'], { label: 'Select Role' }),

    f.password('adminCode', {
      label: 'Admin Access Code',
      dependencies: ['role'],
      renderLogic: (v) => {
        console.log(v.role);
        return v.role === 'admin';
      },
    }),
  ]),

  f.section('Notifications', [
    f.switch('notifications', { label: 'Enable Notifications' }),

    // PROPS LOGIC: Disable if notifications is false
    f.radio(
      'emailFrequency',
      [
        { label: 'weekly', value: 'weekly' },
        { label: 'daily', value: 'daily' },
      ],
      {
        label: 'Frequency',
        dependencies: ['notifications'],
        propsLogic: (v) => ({ disabled: !v.notifications }),
      },
    ),
  ]),
]);

export default function LogicPage() {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Logic & Dependencies
      </Typography>
      <Paper sx={{ p: 4 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          1. Select admin to see the Admin Code field.
          <br />
          2. Toggle Notifications to enable/disable the Frequency radio buttons.
        </Typography>
        <RNGForm
          schema={schema}
          uiSchema={uiSchema}
          defaultValues={{
            adminCode: undefined,
            emailFrequency: undefined,
            notifications: undefined,
            role: undefined,
          }}
          onSubmit={(data) => logInfo('Logic Submit', data)}
        />
      </Paper>
    </Box>
  );
}

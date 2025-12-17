'use client';

import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// 1. Schema Definition
// -----------------------------------------------------------------------------
const linkItemSchema = z.object({ url: z.string().url('Must be a valid URL') });

const schema = z.object({
  settings: z.object({
    notifications: z.boolean(),
    marketing: z.boolean(),
    theme: z.string(),
  }),
  profile: z.object({
    bio: z.string().optional(),
    links: z.array(linkItemSchema).optional(),
  }),
});

// 2. UI Definition
// -----------------------------------------------------------------------------

// Sub-form for the links array
const linksUi = defineForm<typeof linkItemSchema>((l) => [
  l.text('url', { label: 'URL', placeholder: 'https://...' }),
]);

const ui = defineForm<typeof schema>((f) => [
  f.tabs([
    {
      label: 'General Settings',
      children: [
        f.section('Preferences', [
          f.switch('settings.notifications', { label: 'Enable Notifications' }),
          f.switch('settings.marketing', { label: 'Marketing Emails' }),
          f.radio(
            'settings.theme',
            [
              { label: 'Light Mode', value: 'light' },
              { label: 'Dark Mode', value: 'dark' },
              { label: 'System Default', value: 'system' },
            ],
            { label: 'Theme Preference', row: true },
          ),
        ]),
      ],
    },
    {
      label: 'Profile Details',
      children: [
        f.richText('profile.bio', {
          label: 'Bio',
          minHeight: 200,
          description: 'Tell us a little about yourself.',
        }),

        f.accordion([
          {
            title: 'Social Media Links',
            defaultExpanded: true,
            children: [
              f.array('profile.links', linksUi, {
                label: 'Links',
                itemLabel: 'Add Link',
              }),
            ],
          },
        ]),
      ],
    },
  ]),
]);

// 3. Page Component
// -----------------------------------------------------------------------------
export default function LayoutsPage() {
  const [data, setData] = useState<object | null>(null);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Complex Layouts (Tabs & Accordions)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This form demonstrates nesting fields inside Tabs and Accordions, as well as handling deeply
        nested object keys (e.g., <code>settings.theme</code>).
      </Typography>

      <RNGForm
        schema={schema}
        uiSchema={ui}
        defaultValues={{
          settings: { notifications: true, marketing: false, theme: 'light' },
          profile: { links: [{ url: 'https://github.com' }] },
        }}
        onSubmit={setData}
        title="Settings & Profile"
      />

      {data && (
        <Paper sx={{ p: 2 }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Paper>
      )}
    </Box>
  );
}

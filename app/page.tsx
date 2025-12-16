'use client';

import { Box, Container, Divider, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

// Imports from your library structure
import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { zUtils } from '@/rng-form/utils';

// --- TAB PANEL HELPER ---
function CustomTabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PlaygroundPage() {
  const [tabIndex, setTabIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submittedData, setSubmittedData] = useState<any>(null);

  // ---------------------------------------------------------------------------
  // FORM 1: The "Kitchen Sink"
  // ---------------------------------------------------------------------------
  const schema1 = z.object({
    fullName: zUtils.string,
    phone: zUtils.phone,
    creditCard: z.string().min(19, 'Incomplete card number'),
    price: z.number().min(0),
    quantity: z.number().min(1),
    total: z.number().optional(),
    bio: z.string().optional(),
  });

  const ui1 = defineForm<typeof schema1>((f) => [
    f.section('Basic Info', [
      f.text('fullName', { label: 'Full Name', colProps: { size: { xs: 12, md: 6 } } }),
      f.masked('phone', '(000) 000-0000', {
        label: 'Phone (Masked)',
        colProps: { size: { xs: 12, md: 6 } },
      }),
    ]),
    f.section('Payment Details', [
      f.masked('creditCard', '0000 0000 0000 0000', {
        label: 'Credit Card (Masked)',
        placeholder: '0000 0000 0000 0000',
      }),
    ]),
    f.section('Order Calculation (Real-time)', [
      f.currency('price', { label: 'Unit Price ($)', colProps: { size: { xs: 12, md: 4 } } }),
      f.number('quantity', { label: 'Quantity', colProps: { size: { xs: 12, md: 4 } } }),

      // ✅ FIX: 'total' passed as first arg, logic is now robust
      f.calculated(
        'total',
        (values) => {
          const p = Number(values.price) || 0;
          const q = Number(values.quantity) || 0;
          return (p * q).toFixed(2);
        },
        {
          label: 'Total (Calculated)',
          dependencies: ['price', 'quantity'],
          colProps: { size: { xs: 12, md: 4 } },
        },
      ),
    ]),
    f.section('Rich Content', [f.richText('bio', { label: 'Biography', minHeight: 150 })]),
  ]);

  // ---------------------------------------------------------------------------
  // FORM 2: Logic & Arrays (UPDATED)
  // ---------------------------------------------------------------------------

  const skillItemSchema = z.object({
    name: z.string(),
    level: z.string(),
  });

  const skillsUi = defineForm<typeof skillItemSchema>((s) => [
    s.text('name', { label: 'Skill Name', colProps: { size: { xs: 8 } } }),
    s.text('level', { label: 'Level (1-10)', colProps: { size: { xs: 4 } } }),
  ]);

  const schema2 = z.object({
    hasjob: z.boolean(),
    company: z.string().optional(),
    role: z.string().optional(),
    skills: z.array(skillItemSchema),
  });

  const ui2 = defineForm<typeof schema2>((f) => [
    f.switch('hasjob', { label: 'Do you have a job?' }),

    // Render Logic: Only show if hasjob is true
    f.text('company', {
      label: 'Company Name',
      renderLogic: (v) => !!v.hasjob,
    }),

    f.text('role', {
      label: 'Job Role',
      renderLogic: (v) => !!v.hasjob,
      // UPDATED: Removed disabled restriction.
      // Label still updates dynamically if company is typed, but field is always editable.
      propsLogic: (v) => ({
        label: v.company ? `Role at ${v.company}` : 'Job Role',
      }),
      dependencies: ['company'],
    }),

    f.array('skills', skillsUi, {
      label: 'Skills (Drag to Reorder)',
      itemLabel: 'Add Skill',
    }),
  ]);

  // ---------------------------------------------------------------------------
  // FORM 3: Wizard (Multi-step)
  // ---------------------------------------------------------------------------
  const schema3 = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    plan: z.string(),
    agree: z.boolean().refine((val) => val === true, 'You must agree'),
  });

  const ui3 = defineForm<typeof schema3>((f) => [
    f.wizard([
      {
        label: 'Account',
        children: [
          f.text('username', { label: 'Username' }),
          f.text('email', { label: 'Email Address' }),
        ],
      },
      {
        label: 'Subscription',
        children: [
          f.radio(
            'plan',
            [
              { label: 'Free Tier', value: 'free' },
              { label: 'Pro ($10/mo)', value: 'pro' },
            ],
            { label: 'Select a Plan' },
          ),
        ],
      },
      {
        label: 'Terms',
        children: [f.switch('agree', { label: 'I agree to the terms and conditions' })],
      },
    ]),
  ]);

  // ---------------------------------------------------------------------------
  // FORM 4: Complex Layouts (Tabs & Accordions)
  // ---------------------------------------------------------------------------
  const linkItemSchema = z.object({ url: z.string() });
  const linksUi = defineForm<typeof linkItemSchema>((l) => [l.text('url', { label: 'URL' })]);

  const schema4 = z.object({
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

  const ui4 = defineForm<typeof schema4>((f) => [
    f.tabs([
      {
        label: 'General Settings',
        children: [
          f.section('Preferences', [
            f.switch('settings.notifications', { label: 'Enable Notifications' }),
            f.switch('settings.marketing', { label: 'Marketing Emails' }),
          ]),
        ],
      },
      {
        label: 'Profile',
        children: [
          f.richText('profile.bio', { label: 'Bio' }),
          f.accordion([
            {
              title: 'Social Links',
              children: [f.array('profile.links', linksUi)],
            },
          ]),
        ],
      },
    ]),
  ]);

  // --- HANDLER ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (data: any) => {
    setSubmittedData(data);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        RNG-Form Feature Playground
      </Typography>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => {
            setTabIndex(v);
            setSubmittedData(null);
          }}
          variant="scrollable"
        >
          <Tab label="1. Inputs & Masks" />
          <Tab label="2. Logic & Arrays" />
          <Tab label="3. Wizard" />
          <Tab label="4. Layouts" />
        </Tabs>

        {/* --- TEST 1 --- */}
        <CustomTabPanel value={tabIndex} index={0}>
          <RNGForm
            schema={schema1}
            uiSchema={ui1}
            defaultValues={{ price: 10, quantity: 1, phone: '' }}
            onSubmit={(data) => handleSubmit(data)}
            submitLabel="Test Submit"
            title="Feature Showcase"
          />
        </CustomTabPanel>

        {/* --- TEST 2 --- */}
        <CustomTabPanel value={tabIndex} index={1}>
          <RNGForm
            schema={schema2}
            uiSchema={ui2}
            defaultValues={{ hasjob: false, skills: [{ name: 'React', level: 'Expert' }] }}
            onSubmit={(data) => handleSubmit(data)}
            title="Logic & Drag-n-Drop"
          />
        </CustomTabPanel>

        {/* --- TEST 3 --- */}
        <CustomTabPanel value={tabIndex} index={2}>
          <RNGForm
            schema={schema3}
            uiSchema={ui3}
            defaultValues={{ agree: false }}
            onSubmit={(data) => handleSubmit(data)}
            title="Registration Wizard"
          />
        </CustomTabPanel>

        {/* --- TEST 4 --- */}
        <CustomTabPanel value={tabIndex} index={3}>
          <RNGForm
            schema={schema4}
            uiSchema={ui4}
            defaultValues={{
              settings: { notifications: true, marketing: false, theme: 'light' },
              profile: { links: [{ url: 'https://github.com' }] },
            }}
            onSubmit={(data) => handleSubmit(data)}
            title="Complex Layouts"
          />
        </CustomTabPanel>
      </Paper>

      {/* --- SUBMISSION RESULTS --- */}
      {submittedData && (
        <Paper sx={{ p: 3, bgcolor: '#fafafa', border: '1px solid #eee' }}>
          <Typography variant="h6" color="primary">
            Submission Successful
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: '#fff', p: 2, borderRadius: 1 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(submittedData, null, 2)}</pre>
          </Box>
        </Paper>
      )}
    </Container>
  );
}

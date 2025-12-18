'use client';

import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { defineForm } from '@/rng-form/dsl';
import { Box, Paper, Typography } from '@mui/material';
import { z } from 'zod';

const schema = z.object({
  profilephoto: z.boolean(),
  avatar: z.any().optional(),
  images: z.array(z.any()).optional(),
});

const uiSchema = defineForm<typeof schema>((f) => [
  f.switch('profilephoto', {
    label: 'Profile Photo',
  }),
  f.avatar('avatar', {
    label: 'Upload Avatar',
    renderLogic: (_, val) => val.profilephoto === true,
  }),
  f.multiImageEditor('images', {
    label: 'Upload Image Files',
  }),
]);

export default function BasicPage() {
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Basic Inputs
      </Typography>
      <Paper sx={{ p: 4 }}>
        <RNGForm
          schema={schema}
          uiSchema={uiSchema}
          defaultValues={{
            avatar: [],
          }}
          onSubmit={(data) => logInfo('Basic Submit', data)}
          submitLabel="Submit"
        />
      </Paper>
    </Box>
  );
}

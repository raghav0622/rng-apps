'use client';
import { RNGForm } from '@/rng-form';
import { Typography } from '@mui/material';
import z from 'zod';

export default function DashboardPage() {
  return (
    <>
      <Typography variant="h4" fontWeight="bold">
        Dashboard
      </Typography>
      <Typography color="text.secondary">Welcome to your organization overview.</Typography>
      <RNGForm
        schema={z.object({
          test: z.string(),
        })}
        uiSchema={[
          {
            name: 'test',
            type: 'taxonomy',
            scope: 'yolo',
          },
        ]}
        onSubmit={(data) => {
          console.log(data);
        }}
      />
    </>
  );
}

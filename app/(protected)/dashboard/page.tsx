'use client';
import { logInfo } from '@/lib/logger';
import { RNGForm } from '@/rng-form';
import { RNGPage } from '@/rng-ui/layouts/RNGPage';
import z from 'zod';

export default function DashboardPage() {
  return (
    <RNGPage title="Dashboard" description="Welcome to your organization overview.">
      <RNGForm
        schema={z.object({
          test: z.string(),
        })}
        uiSchema={[
          {
            name: 'test',
            label: 'yolo',
            type: 'autocomplete',
            options: ['test', 'test2'],
            required: true,
            getOptionLabel: (option) => option,
            getOptionValue: (option) => option,
            isOptionEqualToValue: (option, value) => option === value,
          },
        ]}
        onSubmit={(data) => {
          logInfo(data as any);
        }}
      />
    </RNGPage>
  );
}

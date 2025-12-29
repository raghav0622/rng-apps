'use client';
import { RNGForm } from '@/rng-form';
import { RNGPage } from '@/ui/layouts/RNGPage';
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
          console.log(data);
        }}
      />
    </RNGPage>
  );
}

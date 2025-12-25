'use client';

import { OrgSettings, UpdateSettingsSchema } from '@/core/org/settings.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Card, CardContent, CardHeader, Divider } from '@mui/material';
import { updateSettingsAction } from '../actions/setting.actions';

const formConfig = defineForm<typeof UpdateSettingsSchema>((f) => [
  f.section('General Preferences', [
    f.text('timezone', { label: 'Timezone', description: 'Used for reporting.' }),
    f.text('locale', { label: 'Language / Locale' }),
  ]),
  f.section('Branding', [
    f.text('primaryColor', { label: 'Primary Brand Color', placeholder: '#000000' }),
  ]),
  f.section('Security', [
    f.switch('mfaRequired', {
      label: 'Enforce MFA',
      description: 'Require all members to use 2FA.',
    }),
  ]),
]);

export function SettingsForm({ initialData }: { initialData: OrgSettings }) {
  const { runAction } = useRNGServerAction(updateSettingsAction, {
    successMessage: 'Settings saved successfully.',
  });

  return (
    <Card variant="outlined">
      <CardHeader title="Organization Settings" subheader="Manage global preferences." />
      <Divider />
      <CardContent>
        <RNGForm
          schema={UpdateSettingsSchema}
          uiSchema={formConfig}
          defaultValues={initialData}
          onSubmit={async (data) => {
            await runAction(data);
          }}
          submitLabel="Save Changes"
        />
      </CardContent>
    </Card>
  );
}

'use client';

import { signUpAction } from '@/core/auth/auth.actions';
import { SignUpSchema } from '@/core/auth/auth.model';
import { useRNGServerAction } from '@/core/safe-action/use-rng-action';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { AuthCard } from '../AuthCard';

export default function SignupPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { runAction } = useRNGServerAction(signUpAction, {
    onSuccess: () => {
      enqueueSnackbar('Account created! Please log in.', { variant: 'success' });
      router.push('/login');
    },
  });

  return (
    <AuthCard title="Create Account" description="Start your journey with us" footer>
      <RNGForm
        schema={SignUpSchema}
        uiSchema={[
          {
            name: 'displayName',
            label: 'Display Name',
            type: 'text',
            placeholder: 'John Doe',
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'you@example.com',
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            placeholder: '••••••••',
          },
          {
            name: 'confirmPassword',
            label: 'Confirm Password',
            type: 'password',
            placeholder: '••••••••',
          },
        ]}
        onSubmit={async (data) => {
          await runAction(data);
        }}
        submitLabel="Create Account"
      />
    </AuthCard>
  );
}

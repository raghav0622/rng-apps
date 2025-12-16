'use client';

import { RNGForm } from '@/rng-form';
import { Card, CardContent } from '@mui/material';
import z from 'zod';

const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export default function Home() {
  return (
    <div>
      <Card>
        <CardContent>
          <RNGForm
            defaultValues={{
              email: '',
              password: '',
            }}
            onSubmit={async ({ email, password }) => {
              throw new Error('Invalid credentials');
            }}
            schema={SignInSchema}
            uiSchema={[
              {
                type: 'text',
                label: 'Email',
                name: 'email',
              },
              {
                name: 'password',
                type: 'password',
                label: 'Password',
              },
            ]}
            description="Sign in to access your Organization"
            submitLabel="Sign In"
            title="Welcome Back!"
          />
        </CardContent>
      </Card>
    </div>
  );
}

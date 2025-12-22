'use client';

import { useRNGAuth } from '@/features/auth/components/AuthContext';
import { clientAuth } from '@/lib/firebase/client';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/ui/modals/AppModal';
import { DialogContentText } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ReactElement } from 'react';
import { z } from 'zod';

const ConfirmPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const confirmPasswordForm = defineForm<typeof ConfirmPasswordSchema>((f) => [
  f.password('password', { label: 'Current Password', autoFocus: true }),
]);

interface ConfirmPasswordModalProps {
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  open?: boolean;
  onClose?: () => void;
  trigger?: ReactElement;
}

export function ConfirmPasswordModal({
  onConfirm,
  title = 'Confirm Password',
  description = 'Please enter your password to confirm this action.',
  confirmLabel = 'Confirm',
  open,
  onClose,
  trigger,
}: ConfirmPasswordModalProps) {
  const { user } = useRNGAuth();

  return (
    <AppModal title={title} open={open} onClose={onClose} trigger={trigger} maxWidth="xs">
      {({ close }) => (
        <>
          <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>
          <RNGForm
            schema={ConfirmPasswordSchema}
            uiSchema={confirmPasswordForm}
            defaultValues={{ password: '' }}
            submitLabel={confirmLabel}
            requireChanges={false}
            onSubmit={async ({ password }) => {
              if (!user?.email) return;

              try {
                // Re-authenticate user before critical action (e.g., Delete Account)
                await signInWithEmailAndPassword(clientAuth, user.email, password);
                await onConfirm();
                close();
              } catch (error: any) {
                throw new FormError(error.message);
              }
            }}
          />
        </>
      )}
    </AppModal>
  );
}

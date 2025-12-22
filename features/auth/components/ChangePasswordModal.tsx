'use client';

import { changePasswordAction } from '@/features/auth/actions/security.actions';
import { useRNGServerAction } from '@/lib/use-rng-action';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/ui/modals/AppModal';
import { useSnackbar } from 'notistack';
import { ReactElement } from 'react';
import { z } from 'zod';

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const changePasswordForm = defineForm<typeof ChangePasswordSchema>((f) => [
  f.password('currentPassword', { label: 'Current Password', autoFocus: true }),
  f.password('newPassword', { label: 'New Password' }),
  f.password('confirmPassword', { label: 'Confirm New Password' }),
]);

interface ChangePasswordModalProps {
  open?: boolean;
  onClose?: () => void;
  trigger?: ReactElement;
}

export function ChangePasswordModal({ open, onClose, trigger }: ChangePasswordModalProps) {
  const { runAction: changePassword } = useRNGServerAction(changePasswordAction);
  const { enqueueSnackbar } = useSnackbar();

  return (
    <AppModal title="Change Password" open={open} onClose={onClose} trigger={trigger} maxWidth="sm">
      {({ close }) => (
        <RNGForm
          schema={ChangePasswordSchema}
          uiSchema={changePasswordForm}
          defaultValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
          submitLabel="Update Password"
          onSubmit={async (values) => {
            try {
              await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
              });
              enqueueSnackbar('Password updated successfully', { variant: 'success' });
              close();
            } catch (error: any) {
              const msg =
                error.code === 'auth/invalid-credential'
                  ? 'Incorrect current password'
                  : error.message;
              throw new FormError(msg);
            }
          }}
        />
      )}
    </AppModal>
  );
}

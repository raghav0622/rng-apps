'use client';

import { RNGForm } from '@/rng-form';
import { AppModal } from '@/ui/modals/AppModal';
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import { useFirebaseClientAuth } from '../hooks/useFirebaseClientAuth';

const ChangePwSchema = z
  .object({
    newPassword: z.string().min(8, 'Min 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { updateUserPassword } = useFirebaseClientAuth();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (data: z.infer<typeof ChangePwSchema>) => {
    try {
      await updateUserPassword(data.newPassword);
      enqueueSnackbar('Password updated successfully', { variant: 'success' });
      onClose();
    } catch (error: any) {
      // Handle "Requires Recent Login" error (auth/requires-recent-login)
      if (error.code === 'auth/requires-recent-login') {
        enqueueSnackbar('For security, please logout and login again to change your password.', {
          variant: 'warning',
        });
      } else {
        throw new Error(error.message);
      }
    }
  };

  return (
    <AppModal open={open} onClose={onClose} title="Change Password">
      <RNGForm
        schema={ChangePwSchema}
        defaultValues={{ newPassword: '', confirm: '' }}
        onSubmit={handleSubmit}
        submitLabel="Update Password"
        uiSchema={[
          { name: 'newPassword', type: 'password', label: 'New Password' },
          { name: 'confirm', type: 'password', label: 'Confirm New Password' },
        ]}
      />
    </AppModal>
  );
}

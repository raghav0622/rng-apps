'use client';

import { RNGForm } from '@/rng-form';
import { AppModal } from '@/ui/modals/AppModal';
import { useSnackbar } from 'notistack';
import { ReactElement } from 'react';
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
  // Make these optional to support "Trigger" mode
  open?: boolean;
  onClose?: () => void;
  trigger?: ReactElement;
}

export function ChangePasswordModal({ open, onClose, trigger }: ChangePasswordModalProps) {
  const { updateUserPassword } = useFirebaseClientAuth();
  const { enqueueSnackbar } = useSnackbar();

  return (
    <AppModal open={open} onClose={onClose} trigger={trigger} title="Change Password">
      {/* We use a render prop here to get access to 'close' from AppModal */}
      {({ close }) => (
        <RNGForm
          schema={ChangePwSchema}
          defaultValues={{ newPassword: '', confirm: '' }}
          submitLabel="Update Password"
          onSubmit={async (data) => {
            try {
              await updateUserPassword(data.newPassword);
              enqueueSnackbar('Password updated successfully', { variant: 'success' });
              // Close the modal on success
              close();
            } catch (error: any) {
              if (error.code === 'auth/requires-recent-login') {
                enqueueSnackbar(
                  'For security, please logout and login again to change your password.',
                  { variant: 'warning' },
                );
              } else {
                throw new Error(error.message);
              }
            }
          }}
          uiSchema={[
            { name: 'newPassword', type: 'password', label: 'New Password' },
            { name: 'confirm', type: 'password', label: 'Confirm New Password' },
          ]}
        />
      )}
    </AppModal>
  );
}

'use client';

import { useRNGServerAction } from '@/lib/use-rng-action';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Close } from '@mui/icons-material'; // Added Import
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material'; // Added Import
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import { changePasswordAction } from '../auth.actions';

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
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { runAction: changePassword } = useRNGServerAction(changePasswordAction);
  const { enqueueSnackbar } = useSnackbar();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Change Password
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
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
              onClose();
            } catch (error: any) {
              const msg =
                error.code === 'auth/invalid-credential'
                  ? 'Incorrect current password'
                  : error.message;
              throw new FormError(msg);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

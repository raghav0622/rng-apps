'use client';

import { clientAuth } from '@/lib/firebase/client';
import { FormError } from '@/rng-form';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Close } from '@mui/icons-material'; // Added Import
import { Dialog, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'; // Added Import
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import { useRNGAuth } from './AuthContext';

const ConfirmPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const confirmPasswordForm = defineForm<typeof ConfirmPasswordSchema>((f) => [
  f.password('password', { label: 'Current Password', autoFocus: true }),
]);

interface ConfirmPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function ConfirmPasswordModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Password',
  description = 'Please enter your password to confirm this action.',
  confirmLabel = 'Confirm',
}: ConfirmPasswordModalProps) {
  const { user } = useRNGAuth();
  const { enqueueSnackbar } = useSnackbar();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
        {title}
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
              await signInWithEmailAndPassword(clientAuth, user.email, password);

              await onConfirm();
              onClose();
            } catch (error: any) {
              throw new FormError(error.message);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Close } from '@mui/icons-material'; // Added Import
import { Dialog, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'; // Added Import
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useSnackbar } from 'notistack';
import { z } from 'zod';
import { useAuth } from './AuthContext';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getClientAuth() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

const ConfirmPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const confirmPasswordForm = defineForm<typeof ConfirmPasswordSchema>((f) => [
  f.password('password', { label: 'Current Password' }),
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
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
        {' '}
        {/* Added right padding to avoid overlap with text */}
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
              const auth = getClientAuth();
              await signInWithEmailAndPassword(auth, user.email, password);

              await onConfirm();
              onClose();
            } catch (error) {
              enqueueSnackbar('Incorrect password', { variant: 'error' });
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

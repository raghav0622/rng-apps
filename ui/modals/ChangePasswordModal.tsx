'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { Close } from '@mui/icons-material'; // Added Import
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material'; // Added Import
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { useSnackbar } from 'notistack';
import { z } from 'zod';

// Ensure Firebase is initialized
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
  f.password('currentPassword', { label: 'Current Password' }),
  f.password('newPassword', { label: 'New Password' }),
  f.password('confirmPassword', { label: 'Confirm New Password' }),
]);

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
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
            if (!user?.email) return;

            try {
              const auth = getClientAuth();

              const userCredential = await signInWithEmailAndPassword(
                auth,
                user.email,
                values.currentPassword,
              );

              await updatePassword(userCredential.user, values.newPassword);

              enqueueSnackbar('Password updated successfully', { variant: 'success' });
              onClose();
            } catch (error) {
              const msg =
                (error as any).code === 'auth/invalid-credential'
                  ? 'Incorrect current password'
                  : error.message;
              enqueueSnackbar(msg, { variant: 'error' });
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

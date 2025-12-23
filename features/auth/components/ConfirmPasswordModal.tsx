'use client';

import { ConfirmPasswordSchema } from '@/features/auth/auth.model';
import { useConfirmPassword } from '@/features/auth/hooks/useConfirmPassword';
import { RNGForm } from '@/rng-form/components/RNGForm';
import { defineForm } from '@/rng-form/dsl';
import { AppModal } from '@/ui/modals/AppModal';
import { DialogContentText } from '@mui/material';
import { ReactElement } from 'react';

// UI Configuration
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
  // Hook handles Auth + Logic
  const { handleConfirm } = useConfirmPassword(onConfirm);

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
            onSubmit={async (data) => {
              // 1. Run Logic
              await handleConfirm(data);
              // 2. Close Modal on Success
              close();
            }}
          />
        </>
      )}
    </AppModal>
  );
}

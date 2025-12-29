'use client';

import { AppModal, AppModalProps } from '@/rng-ui/AppModal';
import { Box, DialogActions, Typography } from '@mui/material';
import { ReactElement, ReactNode, useState } from 'react';
import { RNGButton } from './RNGButton';

/**
 * Enhanced Modal Dialog Component with confirmation pattern
 * 
 * Built on top of AppModal with additional confirmation features:
 * - Trigger pattern for self-managed state
 * - Confirmation/cancel buttons with loading states
 * - Optional description below title
 * - Async action support
 * - Customizable button colors and labels
 * 
 * @example
 * ```tsx
 * // With trigger pattern (self-managed state)
 * <RNGModal
 *   trigger={<RNGButton>Delete</RNGButton>}
 *   title="Delete Entity?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   confirmColor="error"
 *   onConfirm={async () => await deleteEntity(id)}
 * >
 *   <Typography>Are you sure?</Typography>
 * </RNGModal>
 * 
 * // Controlled mode
 * <RNGModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Confirm Action"
 *   onConfirm={async () => await performAction()}
 * >
 *   <Typography>Content here</Typography>
 * </RNGModal>
 * ```
 */
export interface RNGModalProps extends Omit<AppModalProps, 'children'> {
  /** Optional description below title */
  description?: string;
  
  /** Modal content */
  children: ReactNode;
  
  /** Confirm button label (default: "Confirm") */
  confirmLabel?: string;
  
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
  
  /** Confirm button callback */
  onConfirm?: () => void | Promise<void>;
  
  /** Confirm button color */
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  
  /** Hide confirm button */
  hideConfirm?: boolean;
  
  /** Hide cancel button */
  hideCancel?: boolean;
  
  /** Custom action buttons */
  customActions?: ReactNode;
  
  /** Disable backdrop click to close */
  disableBackdropClick?: boolean;
  
  /** Controlled open state (optional, omit to use trigger pattern) */
  open?: boolean;
  
  /** Controlled close handler (required if open is provided) */
  onClose?: () => void;
}

/**
 * Enhanced Modal Dialog Component
 * 
 * Extends AppModal with confirmation dialog pattern.
 * Supports both controlled and uncontrolled (trigger) modes.
 * Handles loading states, async actions, and accessibility.
 * 
 * @param props - Component props
 * @returns RNGModal component
 */
export function RNGModal({
  trigger,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  confirmColor = 'primary',
  hideConfirm = false,
  hideCancel = false,
  customActions,
  disableBackdropClick = false,
  open: controlledOpen,
  onClose: controlledOnClose,
  ...dialogProps
}: RNGModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async (close: () => void) => {
    if (onConfirm) {
      try {
        setIsLoading(true);
        await onConfirm();
        close();
      } catch (error) {
        console.error('Confirmation action failed:', error);
        // Don't close on error
      } finally {
        setIsLoading(false);
      }
    } else {
      close();
    }
  };

  const content = (modalProps: { open: boolean; setOpen: (open: boolean) => void; close: () => void }) => (
    <>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, mt: -1 }}
        >
          {description}
        </Typography>
      )}
      
      {children}
      
      <DialogActions sx={{ p: 0, pt: 3, gap: 1 }}>
        {customActions}
        
        {!hideCancel && (
          <RNGButton
            variant="outlined"
            onClick={modalProps.close}
            disabled={isLoading}
          >
            {cancelLabel}
          </RNGButton>
        )}
        
        {!hideConfirm && onConfirm && (
          <RNGButton
            variant="contained"
            color={confirmColor}
            onClick={() => handleConfirm(modalProps.close)}
            isLoading={isLoading}
          >
            {confirmLabel}
          </RNGButton>
        )}
      </DialogActions>
    </>
  );

  // If controlled mode (open/onClose provided)
  if (controlledOpen !== undefined && controlledOnClose) {
    // Create a controlled trigger that doesn't actually trigger
    const dummyTrigger = <Box sx={{ display: 'none' }} />;
    
    return (
      <AppModal
        trigger={dummyTrigger}
        title={title}
        noPadding={false}
        onClose={(_, reason) => {
          if (disableBackdropClick && reason === 'backdropClick') {
            return;
          }
          controlledOnClose();
        }}
        {...dialogProps}
      >
        {(modalProps) => content(modalProps)}
      </AppModal>
    );
  }

  // Uncontrolled mode with trigger
  return (
    <AppModal
      trigger={trigger}
      title={title}
      noPadding={false}
      onClose={(_, reason) => {
        if (disableBackdropClick && reason === 'backdropClick') {
          return;
        }
      }}
      {...dialogProps}
    >
      {(modalProps) => content(modalProps)}
    </AppModal>
  );
}

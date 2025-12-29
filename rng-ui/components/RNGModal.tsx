'use client';

import { Close } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { RNGButton } from './RNGButton';

/**
 * Modal Dialog Component with confirmation pattern
 * 
 * Provides a consistent modal interface with:
 * - Title and optional description
 * - Scrollable content area
 * - Action buttons (confirm, cancel, custom)
 * - Close button
 * - Backdrop click handling
 * 
 * @example
 * ```tsx
 * import { RNGModal } from '@/rng-ui/components/RNGModal';
 * 
 * const [open, setOpen] = useState(false);
 * 
 * <RNGModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="Delete Entity?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   confirmColor="error"
 *   onConfirm={async () => {
 *     await deleteEntity(id);
 *     setOpen(false);
 *   }}
 * >
 *   <Typography>
 *     Are you sure you want to delete "{entityName}"?
 *   </Typography>
 * </RNGModal>
 * ```
 */
export interface RNGModalProps {
  /** Whether modal is open */
  open: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Modal title */
  title: string;
  
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
  
  /** Max width of modal */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Full width modal */
  fullWidth?: boolean;
  
  /** Disable backdrop click to close */
  disableBackdropClick?: boolean;
  
  /** Loading state for confirm button */
  isLoading?: boolean;
}

/**
 * Modal Dialog Component
 * 
 * Reusable modal with consistent styling and behavior.
 * Handles loading states, confirmation patterns, and accessibility.
 * 
 * @param props - Component props
 * @returns RNGModal component
 */
export function RNGModal({
  open,
  onClose,
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
  maxWidth = 'sm',
  fullWidth = true,
  disableBackdropClick = false,
  isLoading = false,
}: RNGModalProps) {
  const handleClose = (_event: any, reason: string) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose();
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <DialogTitle
        id="modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" component="span" fontWeight={600}>
            {title}
          </Typography>
          {description && (
            <Typography
              id="modal-description"
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {description}
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {children}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {customActions}
        
        {!hideCancel && (
          <RNGButton
            variant="outlined"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </RNGButton>
        )}
        
        {!hideConfirm && onConfirm && (
          <RNGButton
            variant="contained"
            color={confirmColor}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </RNGButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

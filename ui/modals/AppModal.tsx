'use client';

import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { cloneElement, isValidElement, ReactElement, useState } from 'react';

// Define the signature for the Render Prop function
type ChildrenFn = (props: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
}) => React.ReactNode;

export interface AppModalProps extends Omit<DialogProps, 'open' | 'title' | 'children'> {
  /**
   * The content of the modal. Can be a React Node or a Function (Render Prop).
   * Function signature: `({ open, setOpen, close }) => ReactNode`
   */
  children: React.ReactNode | ChildrenFn;

  /** Title of the Dialog */
  title?: React.ReactNode;

  /**
   * Optional trigger element. If provided, the Modal becomes "Uncontrolled"
   * and manages its own open state. Clicking this element opens the modal.
   */
  trigger?: ReactElement;

  /** Remove default padding from content for custom layouts */
  noPadding?: boolean;
}

export function AppModal({ trigger, title, children, noPadding = false, ...props }: AppModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Internal state for uncontrolled mode
  const [isOpen, setInternalOpen] = useState(false);

  // Determine if we are in "Controlled" or "Uncontrolled" mode

  const handleOpen = () => setInternalOpen(true);
  const handleClose = () => setInternalOpen(false);

  // Clone the trigger element to attach the onClick handler
  const triggerElement =
    trigger && isValidElement(trigger)
      ? cloneElement(trigger as ReactElement<any>, {
          onClick: (e: React.MouseEvent) => {
            handleOpen();
            // Call original onClick if it exists
            (trigger.props as any).onClick?.(e);
          },
        })
      : trigger;

  // Resolve children if it's a function (Render Prop pattern)
  const renderedChildren =
    typeof children === 'function'
      ? (children as ChildrenFn)({
          open: isOpen,
          setOpen: setInternalOpen, // No-op if controlled
          close: handleClose,
        })
      : children;

  return (
    <>
      {triggerElement}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        {...props}
      >
        {title && (
          <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
            {title}
            <IconButton
              aria-label="close"
              onClick={handleClose}
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
        )}
        <DialogContent sx={noPadding ? { p: 0 } : undefined}>{renderedChildren}</DialogContent>
      </Dialog>
    </>
  );
}

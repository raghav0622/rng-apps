'use client';

import { Alert, AlertProps, Collapse } from '@mui/material';
import { useState } from 'react';

interface AlertBannerProps extends AlertProps {
  isVisible?: boolean;
  onDismiss?: () => void;
  /** If true, the banner controls its own visibility state */
  autoDismiss?: boolean;
}

export function AlertBanner({
  isVisible = true,
  onDismiss,
  autoDismiss = false,
  children,
  sx,
  ...props
}: AlertBannerProps) {
  const [internalVisible, setInternalVisible] = useState(true);

  const show = autoDismiss ? internalVisible : isVisible;

  const handleClose = () => {
    if (autoDismiss) setInternalVisible(false);
    onDismiss?.();
  };

  return (
    <Collapse in={show}>
      <Alert
        onClose={onDismiss || autoDismiss ? handleClose : undefined}
        sx={{ borderRadius: 0, ...sx }}
        {...props}
      >
        {children}
      </Alert>
    </Collapse>
  );
}

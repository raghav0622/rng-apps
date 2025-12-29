'use client';

import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { ReactNode, forwardRef } from 'react';

/**
 * 🎨 RNGButton Variants
 */
export type RNGButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

interface RNGButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  /**
   * The visual style of the button.
   * @default 'primary'
   */
  rngVariant?: RNGButtonVariant;
  /**
   * Shows a loading spinner and disables the button.
   */
  isLoading?: boolean;
  /**
   * Text for the loading state.
   */
  loadingLabel?: string;
  /**
   * Keyboard shortcut hint to show in a tooltip (e.g. 'Ctrl+S').
   */
  shortcut?: string;
  children: ReactNode;
}

/**
 * 🎨 RNGButton
 * A high-performance, enterprise-ready button component with built-in loading states
 * and keyboard shortcut support.
 */
export const RNGButton = forwardRef<HTMLButtonElement, RNGButtonProps>(
  (
    {
      rngVariant = 'primary',
      isLoading = false,
      loadingLabel,
      shortcut,
      disabled,
      children,
      startIcon,
      endIcon,
      sx,
      ...props
    },
    ref
  ) => {
    // Map RNG variants to MUI props
    let muiVariant: MuiButtonProps['variant'] = 'contained';
    let muiColor: MuiButtonProps['color'] = 'primary';

    if (rngVariant === 'secondary') {
      muiVariant = 'outlined';
      muiColor = 'secondary';
    } else if (rngVariant === 'ghost') {
      muiVariant = 'text';
      muiColor = 'inherit';
    } else if (rngVariant === 'danger') {
      muiVariant = 'contained';
      muiColor = 'error';
    } else if (rngVariant === 'link') {
      muiVariant = 'text';
      muiColor = 'primary';
    }

    const buttonContent = (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        color={muiColor}
        disabled={disabled || isLoading}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            startIcon
          )
        }
        endIcon={!isLoading ? endIcon : null}
        sx={{
          position: 'relative',
          fontWeight: 600,
          ...(rngVariant === 'link' && {
            padding: 0,
            minWidth: 0,
            '&:hover': {
              textDecoration: 'underline',
              backgroundColor: 'transparent',
            },
          }),
          ...sx,
        }}
        {...props}
      >
        {isLoading && loadingLabel ? loadingLabel : children}
      </MuiButton>
    );

    if (shortcut) {
      return (
        <Tooltip title={`Shortcut: ${shortcut}`} arrow placement="top">
          <span>{buttonContent}</span>
        </Tooltip>
      );
    }

    return buttonContent;
  }
);

RNGButton.displayName = 'RNGButton';

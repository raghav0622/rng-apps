'use client';

import { SvgIconProps } from '@mui/material';
import * as Icons from '@mui/icons-material';
import { ElementType } from 'react';

/**
 * Valid Icon names from Material UI Icons
 */
export type RNGIconName = keyof typeof Icons;

interface RNGIconProps extends SvgIconProps {
  /**
   * The name of the Material UI icon to render.
   * Example: 'Dashboard', 'Settings', 'Person'
   */
  name?: RNGIconName;
  /**
   * Custom icon component to render.
   */
  icon?: ElementType;
  /**
   * Sizing shorthand
   */
  size?: 'small' | 'medium' | 'large' | number;
}

/**
 * 🎨 RNGIcon
 * A centralized icon wrapper enforcing consistent sizing and allowing icon sets swapping.
 */
export function RNGIcon({ name, icon: CustomIcon, size, sx, ...props }: RNGIconProps) {
  const IconComponent = CustomIcon || (name ? Icons[name] : null);

  if (!IconComponent) {
    return null;
  }

  const fontSize = typeof size === 'string' ? size : undefined;
  const customSize = typeof size === 'number' ? `${size}px` : undefined;

  return (
    <IconComponent
      fontSize={fontSize}
      sx={{
        ...(customSize && { width: customSize, height: customSize, fontSize: customSize }),
        ...sx,
      }}
      {...props}
    />
  );
}

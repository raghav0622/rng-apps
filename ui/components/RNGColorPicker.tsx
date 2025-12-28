'use client';

import * as React from 'react';
import { Box, Popover, Slider, TextField, Typography, Stack, Button } from '@mui/material';
import { HexColorPicker } from 'react-colorful';

interface RNGColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

/**
 * 🎨 RNGColorPicker
 * A user-friendly color selection tool using 'react-colorful'.
 */
export function RNGColorPicker({ value, onChange, label = 'Color' }: RNGColorPickerProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      {label && (
        <Typography variant="caption" display="block" gutterBottom>
          {label}
        </Typography>
      )}
      <Button
        onClick={handleClick}
        variant="outlined"
        sx={{
          p: 0.5,
          minWidth: 0,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pr: 2,
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 0.5,
            bgcolor: value,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {value}
        </Typography>
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <HexColorPicker color={value} onChange={onChange} />
          <Box sx={{ mt: 2 }}>
            <TextField
              size="small"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              fullWidth
              inputProps={{ style: { fontFamily: 'monospace' } }}
            />
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

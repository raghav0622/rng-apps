'use client';

import * as React from 'react';
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  CircularProgress,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface RNGSplitButtonOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface RNGSplitButtonProps {
  /**
   * Options for the dropdown menu
   */
  options: RNGSplitButtonOption[];
  /**
   * Index of the current selected option (acts as the primary button action)
   */
  selectedIndex: number;
  /**
   * Callback when the main button is clicked
   */
  onMainClick?: () => void;
  /**
   * visual style variant
   */
  variant?: 'contained' | 'outlined' | 'text';
  /**
   * Loading state for the main button
   */
  isLoading?: boolean;
  /**
   * Full width toggle
   */
  fullWidth?: boolean;
  /**
   * Size shorthand
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Color shorthand
   */
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

/**
 * 🎨 RNGSplitButton
 * A complex button component combining a primary action with a dropdown of secondary actions.
 */
export function RNGSplitButton({
  options,
  selectedIndex,
  onMainClick,
  variant = 'contained',
  isLoading = false,
  fullWidth = false,
  size = 'medium',
  color = 'primary',
}: RNGSplitButtonProps) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    options[index].onClick();
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  return (
    <React.Fragment>
      <ButtonGroup
        variant={variant}
        color={color}
        ref={anchorRef}
        aria-label="split button"
        fullWidth={fullWidth}
        size={size}
        disabled={isLoading}
      >
        <Button 
          onClick={onMainClick || options[selectedIndex].onClick}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          fullWidth={fullWidth}
        >
          {options[selectedIndex].label}
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper elevation={8}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.label}
                      disabled={option.disabled}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
}

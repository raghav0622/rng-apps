'use client';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Close } from '@mui/icons-material';
import { Button, Dialog, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import { useState } from 'react';

interface RNGModalLayoutProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'modal-form' };
  pathPrefix?: string;
}

export function RNGModalLayout<S extends FormSchema>({ item, pathPrefix }: RNGModalLayoutProps<S>) {
  const [open, setOpen] = useState(false);

  return (
    <Grid size={item.colProps?.size ?? 12} {...item.colProps}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {item.triggerLabel}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="modal-form-title"
      >
        <DialogTitle
          id="modal-form-title"
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {item.dialogTitle || item.triggerLabel}
          <IconButton onClick={() => setOpen(false)} aria-label="close">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
        </DialogContent>
      </Dialog>
    </Grid>
  );
}

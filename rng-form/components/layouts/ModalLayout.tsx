'use client';
import { Close } from '@mui/icons-material';
import { Button, Dialog, DialogContent, DialogTitle, Grid, IconButton } from '@mui/material';
import { useState } from 'react';
import { FormSchema, ModalFormItem } from '../../types';
import { FormBuilder } from '../FormBuilder';

export function RNGModalLayout<S extends FormSchema>({
  item,
  pathPrefix,
}: {
  item: ModalFormItem<S>;
  pathPrefix?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
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
          <Grid container spacing={2}>
            <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}

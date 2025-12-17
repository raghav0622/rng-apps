'use client';

import { CloudUpload, Search } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import React, { useRef } from 'react';
import {
  AutocompleteItem,
  DateRangeItem,
  FileItem,
  LocationItem,
  OtpItem,
  SignatureItem,
  TransferListItem,
} from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- FILE UPLOAD ---
export function RNGFileUpload({ item }: { item: FileItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
          component="label"
        >
          <input
            type="file"
            hidden
            multiple={mergedItem.multiple}
            accept={mergedItem.accept}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                field.onChange(mergedItem.multiple ? Array.from(files) : files[0]);
              }
            }}
          />
          <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography>Click or Drag to Upload {mergedItem.label}</Typography>
          {field.value && (
            <Box sx={{ mt: 2 }}>
              {Array.isArray(field.value) ? (
                field.value.map((f: File, i: number) => (
                  <Chip
                    key={i}
                    label={f.name}
                    sx={{ m: 0.5 }}
                    onDelete={() => {
                      // Simple delete logic if needed
                    }}
                  />
                ))
              ) : (
                <Chip label={(field.value as File).name} />
              )}
            </Box>
          )}
        </Box>
      )}
    </FieldWrapper>
  );
}

// --- AUTOCOMPLETE ---
export function RNGAutocomplete({ item }: { item: AutocompleteItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Autocomplete
          {...field}
          multiple={mergedItem.multiple}
          options={mergedItem.options}
          getOptionLabel={
            mergedItem.getOptionLabel ||
            ((opt) => (typeof opt === 'string' ? opt : (opt as any).label || ''))
          }
          isOptionEqualToValue={(opt, val) =>
            typeof opt === 'string' ? opt === val : (opt as any).value === (val as any).value
          }
          onChange={(_, data) => field.onChange(data)}
          renderInput={(params) => (
            <TextField {...params} placeholder={mergedItem.label} variant="outlined" />
          )}
        />
      )}
    </FieldWrapper>
  );
}

// --- DATE INPUT ---
export function RNGDateInput({ item }: { item: any }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, fieldState) => (
        <TextField
          {...field}
          type="date"
          fullWidth
          error={!!fieldState.error}
          value={
            field.value instanceof Date
              ? field.value.toISOString().split('T')[0]
              : (field.value ?? '')
          }
          // Fix: Cast target to HTMLInputElement to access valueAsDate
          onChange={(e) => field.onChange((e.target as HTMLInputElement).valueAsDate)}
        />
      )}
    </FieldWrapper>
  );
}

// --- DATE RANGE ---
export function RNGDateRange({ item }: { item: DateRangeItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const val = field.value || { start: null, end: null };
        return (
          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={
                val.start instanceof Date
                  ? val.start.toISOString().split('T')[0]
                  : (val.start ?? '')
              }
              // Fix: Cast target to HTMLInputElement
              onChange={(e) =>
                field.onChange({
                  ...val,
                  start: (e.target as HTMLInputElement).valueAsDate,
                })
              }
            />
            <TextField
              type="date"
              label="End Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={
                val.end instanceof Date ? val.end.toISOString().split('T')[0] : (val.end ?? '')
              }
              // Fix: Cast target to HTMLInputElement
              onChange={(e) =>
                field.onChange({
                  ...val,
                  end: (e.target as HTMLInputElement).valueAsDate,
                })
              }
            />
          </Stack>
        );
      }}
    </FieldWrapper>
  );
}

// --- OTP INPUT ---
export function RNGOtpInput({ item }: { item: OtpItem<any> }) {
  const length = item.length || 6;
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const handleChange = (index: number, val: string) => {
          if (!/^\d*$/.test(val)) return; // Only numbers
          const current = (field.value || '').padEnd(length, ' ').split('');
          current[index] = val;
          const newValue = current.join('').trim();
          field.onChange(newValue);

          // Auto-focus next
          if (val && index < length - 1) {
            const nextInput = document.getElementById(`${item.name}-otp-${index + 1}`);
            nextInput?.focus();
          }
        };

        const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
          if (e.key === 'Backspace' && !(field.value || '')[index] && index > 0) {
            const prevInput = document.getElementById(`${item.name}-otp-${index - 1}`);
            prevInput?.focus();
          }
        };

        return (
          <Stack direction="row" spacing={1}>
            {Array.from({ length }).map((_, i) => (
              <TextField
                key={i}
                id={`${item.name}-otp-${i}`}
                value={(field.value || '')[i] || ''}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                inputProps={{
                  maxLength: 1,
                  style: { textAlign: 'center', width: '1ch' },
                }}
              />
            ))}
          </Stack>
        );
      }}
    </FieldWrapper>
  );
}

// --- SIGNATURE PAD (Simple Canvas) ---
export function RNGSignature({ item }: { item: SignatureItem<any> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const startDrawing = (e: React.MouseEvent) => {
          isDrawing.current = true;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          }
        };
        const draw = (e: React.MouseEvent) => {
          if (!isDrawing.current) return;
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
            ctx.stroke();
          }
        };
        const stopDrawing = () => {
          isDrawing.current = false;
          // Save to field value
          if (canvasRef.current) {
            field.onChange(canvasRef.current.toDataURL());
          }
        };

        const clear = () => {
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            field.onChange('');
          }
        };

        return (
          <Box
            sx={{
              border: '1px solid #ccc',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              width={500}
              height={item.height || 150}
              style={{ display: 'block', background: '#fff' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <Box sx={{ p: 1, borderTop: '1px solid #eee', bgcolor: '#f9f9f9' }}>
              <Button size="small" onClick={clear}>
                Clear Signature
              </Button>
            </Box>
          </Box>
        );
      }}
    </FieldWrapper>
  );
}

// --- TRANSFER LIST ---
export function RNGTransferList({ item }: { item: TransferListItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => {
        const checked = field.value || [];
        const left = item.options.filter((o) => !checked.includes(o.value));
        const right = item.options.filter((o) => checked.includes(o.value));

        const handleMove = (val: any, direction: 'left' | 'right') => {
          const newChecked =
            direction === 'right' ? [...checked, val] : checked.filter((v: any) => v !== val);
          field.onChange(newChecked);
        };

        const CustomList = ({ items, dir }: { items: any[]; dir: 'left' | 'right' }) => (
          <Paper variant="outlined" sx={{ width: 200, height: 230, overflow: 'auto' }}>
            <List dense component="div" role="list">
              {items.map((opt) => (
                // Fix: Use ListItemButton instead of button prop on ListItem
                <ListItem key={opt.value} disablePadding>
                  <ListItemButton onClick={() => handleMove(opt.value, dir)}>
                    <ListItemIcon>
                      <Checkbox checked={dir === 'right'} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={opt.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        );

        return (
          <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid>{CustomList({ items: left, dir: 'right' })}</Grid>
            <Grid>
              <Typography variant="body2" color="text.secondary">
                Click items to move
              </Typography>
            </Grid>
            <Grid>{CustomList({ items: right, dir: 'left' })}</Grid>
          </Grid>
        );
      }}
    </FieldWrapper>
  );
}

// --- LOCATION (Mock/Simple Structure) ---
export function RNGLocation({ item }: { item: LocationItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field) => (
        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
          <TextField
            fullWidth
            label="Address Search"
            placeholder="Enter location..."
            value={field.value?.address || ''}
            onChange={(e) => field.onChange({ ...field.value, address: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="City"
              size="small"
              value={field.value?.city || ''}
              onChange={(e) => field.onChange({ ...field.value, city: e.target.value })}
            />
            <TextField
              label="State"
              size="small"
              value={field.value?.state || ''}
              onChange={(e) => field.onChange({ ...field.value, state: e.target.value })}
            />
            <TextField
              label="Zip"
              size="small"
              value={field.value?.zip || ''}
              onChange={(e) => field.onChange({ ...field.value, zip: e.target.value })}
            />
          </Stack>
        </Box>
      )}
    </FieldWrapper>
  );
}

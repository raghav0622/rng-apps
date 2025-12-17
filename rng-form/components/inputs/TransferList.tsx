'use client';

import {
  Checkbox,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { TransferListItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

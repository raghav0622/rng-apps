'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
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

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGTransferListProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'transfer-list' };
}

export function RNGTransferList<S extends FormSchema>({ item }: RNGTransferListProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => {
        const checked = field.value || [];
        const left = mergedItem.options.filter((o) => !checked.includes(o.value));
        const right = mergedItem.options.filter((o) => checked.includes(o.value));
        const [leftTitle, rightTitle] = mergedItem.titles || ['Choices', 'Chosen'];

        const handleMove = (val: any, direction: 'left' | 'right') => {
          if (mergedItem.disabled) return;
          const newChecked =
            direction === 'right' ? [...checked, val] : checked.filter((v: any) => v !== val);
          field.onChange(newChecked);
        };

        const CustomList = ({
          items,
          dir,
          title,
        }: {
          items: any[];
          dir: 'left' | 'right';
          title: string;
        }) => (
          <Paper variant="outlined" sx={{ width: 200, height: 230, overflow: 'auto' }}>
            <Typography
              variant="subtitle2"
              sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}
            >
              {title}
            </Typography>
            <List dense component="div" role="list">
              {items.map((opt) => (
                <ListItem key={String(opt.value)} disablePadding>
                  <ListItemButton
                    onClick={() => handleMove(opt.value, dir)}
                    disabled={mergedItem.disabled}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={dir === 'right'}
                        tabIndex={-1}
                        disableRipple
                        disabled={mergedItem.disabled}
                      />
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
            <Grid>{CustomList({ items: left, dir: 'right', title: leftTitle })}</Grid>
            <Grid>
              <Typography variant="body2" color="text.secondary">
                Click items to move
              </Typography>
            </Grid>
            <Grid>{CustomList({ items: right, dir: 'left', title: rightTitle })}</Grid>
          </Grid>
        );
      }}
    </FieldWrapper>
  );
}

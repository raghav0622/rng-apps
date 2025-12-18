'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormBuilder } from '@/rng-form/components/FormBuilder';
import { FormSchema, LayoutItem } from '@/rng-form/types';
import { Add, Delete } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useFieldArray, useFormContext } from 'react-hook-form';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RNGArrayFieldProps<S extends FormSchema> {
  item: LayoutItem<S> & { type: 'array' };
  pathPrefix?: string;
}

export function RNGArrayField<S extends FormSchema>({ item }: RNGArrayFieldProps<S>) {
  const { control } = useFormContext();

  return (
    <FieldWrapper item={item} name={item.name}>
      {() => <ArrayFieldContent item={item} control={control} />}
    </FieldWrapper>
  );
}

function ArrayFieldContent({
  item,
  control,
}: {
  item: LayoutItem<any> & { type: 'array' };
  control: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: item.name as string,
  });

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      {fields.map((field, index) => (
        <Card key={field.id} variant="outlined">
          <CardHeader
            title={
              <Typography variant="subtitle2" color="text.secondary">
                {item.itemLabel || 'Item'} #{index + 1}
              </Typography>
            }
            action={
              <IconButton
                size="small"
                onClick={() => remove(index)}
                color="error"
                aria-label="remove item"
              >
                <Delete />
              </IconButton>
            }
            sx={{ pb: 0 }}
          />
          <CardContent>
            {/* Pass pathPrefix correctly. 
                     FormBuilder creates its own Grid container, which sits nicely inside CardContent.
                 */}
            <FormBuilder uiSchema={item.items} pathPrefix={`${item.name}.${index}`} />
          </CardContent>
        </Card>
      ))}

      <Box>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => append(item.defaultValue || {})}
        >
          Add {item.itemLabel || 'Item'}
        </Button>
      </Box>
    </Stack>
  );
}

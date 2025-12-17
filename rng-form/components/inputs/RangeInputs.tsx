'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Box, Rating, Slider, Typography } from '@mui/material';

interface RNGSliderProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'slider' };
}

export function RNGSlider<S extends FormSchema>({ item }: RNGSliderProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box sx={{ width: '100%', px: 1, mt: 1 }}>
          <Typography gutterBottom variant="body2">
            {mergedItem.label}
          </Typography>
          <Slider
            value={typeof field.value === 'number' ? field.value : mergedItem.min || 0}
            onChange={(_, val) => field.onChange(val)}
            min={mergedItem.min}
            max={mergedItem.max}
            step={mergedItem.step}
            valueLabelDisplay="auto"
            disabled={mergedItem.disabled}
          />
        </Box>
      )}
    </FieldWrapper>
  );
}

interface RNGRatingProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'rating' };
}

export function RNGRating<S extends FormSchema>({ item }: RNGRatingProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <Box display="flex" flexDirection="column">
          <Typography component="legend" variant="body2">
            {mergedItem.label}
          </Typography>
          <Rating
            value={Number(field.value) || 0}
            onChange={(_, val) => field.onChange(Number(val))}
            max={mergedItem.max}
            precision={mergedItem.precision}
            disabled={mergedItem.disabled}
          />
        </Box>
      )}
    </FieldWrapper>
  );
}

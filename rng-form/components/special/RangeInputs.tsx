'use client';
import { FieldWrapper } from '@/rng-form/components/FieldWrapper';
import { FormSchema, InputItem } from '@/rng-form/types';
import { Box, Rating, Slider, Typography } from '@mui/material';

// --- SLIDER COMPONENT ---

interface RNGSliderProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'slider' };
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGSlider<S extends FormSchema>({ item, pathPrefix }: RNGSliderProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _, mergedItem) => {
        // 🛡️ Safe property access
        const min = 'min' in mergedItem ? (mergedItem as any).min : 0;
        const max = 'max' in mergedItem ? (mergedItem as any).max : 100;
        const step = 'step' in mergedItem ? (mergedItem as any).step : 1;

        return (
          <Box sx={{ width: '100%', px: 1, mt: 1 }}>
            <Typography gutterBottom variant="body2">
              {mergedItem.label}
            </Typography>
            <Slider
              value={typeof field.value === 'number' ? field.value : min}
              onChange={(_, val) => field.onChange(val)}
              min={min}
              max={max}
              step={step}
              valueLabelDisplay="auto"
              disabled={mergedItem.disabled}
            />
          </Box>
        );
      }}
    </FieldWrapper>
  );
}

// --- RATING COMPONENT ---

interface RNGRatingProps<S extends FormSchema> {
  item: InputItem<S> & { type: 'rating' };
  pathPrefix?: string; // ✅ Added support for scoped paths
}

export function RNGRating<S extends FormSchema>({ item, pathPrefix }: RNGRatingProps<S>) {
  return (
    <FieldWrapper item={item} name={item.name} pathPrefix={pathPrefix}>
      {(field, _, mergedItem) => {
        // 🛡️ Safe property access
        const max = 'max' in mergedItem ? (mergedItem as any).max : 5;
        const precision = 'precision' in mergedItem ? (mergedItem as any).precision : 1;

        return (
          <Box display="flex" flexDirection="column">
            <Typography component="legend" variant="body2">
              {mergedItem.label}
            </Typography>
            <Rating
              value={Number(field.value) || 0}
              onChange={(_, val) => field.onChange(Number(val))}
              max={max}
              precision={precision}
              disabled={mergedItem.disabled}
            />
          </Box>
        );
      }}
    </FieldWrapper>
  );
}

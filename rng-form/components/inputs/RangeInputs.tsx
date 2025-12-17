'use client';

import { Box, Rating, Slider, Typography } from '@mui/material';
import { RatingItem, SliderItem } from '../../types';
import { FieldWrapper } from '../FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGSlider({ item }: { item: SliderItem<any> }) {
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
          />
        </Box>
      )}
    </FieldWrapper>
  );
}

export function RNGRating({ item }: { item: RatingItem<any> }) {
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
          />
        </Box>
      )}
    </FieldWrapper>
  );
}

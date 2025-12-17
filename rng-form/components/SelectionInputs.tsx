'use client';

import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Rating,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import {
  CheckboxGroupItem,
  RadioGroupItem,
  RatingItem,
  SliderItem,
  SwitchFieldItem,
} from '../types';
import { FieldWrapper } from './FieldWrapper';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function RNGSwitch({ item }: { item: SwitchFieldItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <FormControlLabel
          control={
            <Switch
              {...field}
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          }
          label={mergedItem.label}
        />
      )}
    </FieldWrapper>
  );
}

export function RNGRadioGroup({ item }: { item: RadioGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => (
        <>
          <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
            {mergedItem.label}
          </FormLabel>
          <RadioGroup {...field} value={field.value ?? ''} row={mergedItem.row}>
            {mergedItem.options.map((opt) => (
              <FormControlLabel
                key={opt.value.toString()}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </>
      )}
    </FieldWrapper>
  );
}

export function RNGCheckboxGroup({ item }: { item: CheckboxGroupItem<any> }) {
  return (
    <FieldWrapper item={item} name={item.name}>
      {(field, _, mergedItem) => {
        const handleToggle = (optionValue: string | number | boolean) => {
          const currentValues = Array.isArray(field.value) ? field.value : [];
          const newValues = currentValues.includes(optionValue)
            ? currentValues.filter((v: any) => v !== optionValue)
            : [...currentValues, optionValue];
          field.onChange(newValues);
        };

        return (
          <>
            <FormLabel component="legend" sx={{ fontWeight: 500, mb: 1 }}>
              {mergedItem.label}
            </FormLabel>
            <FormGroup row={mergedItem.row}>
              {mergedItem.options.map((opt) => (
                <FormControlLabel
                  key={opt.value.toString()}
                  control={
                    <Checkbox
                      checked={Array.isArray(field.value) && field.value.includes(opt.value)}
                      onChange={() => handleToggle(opt.value)}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
          </>
        );
      }}
    </FieldWrapper>
  );
}

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
            onChange={(_, val) => field.onChange(val)}
            max={mergedItem.max}
            precision={mergedItem.precision}
          />
        </Box>
      )}
    </FieldWrapper>
  );
}

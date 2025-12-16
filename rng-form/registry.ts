'use client';

import { RNGAutocomplete, RNGDateInput, RNGFileUpload } from './components/AdvancedInputs';
import { RNGArrayField } from './components/ArrayField';
import { RNGAsyncAutocomplete } from './components/AsyncInputs';
import { RNGCalculatedField } from './components/CalculatedField';
import {
  RNGCheckboxGroup,
  RNGNumberInput,
  RNGRadioGroup,
  RNGRating,
  RNGSlider,
  RNGSwitch,
  RNGTextInput,
} from './components/Inputs';
import { RNGMaskedInput } from './components/MaskedInput';
import { RNGRichText } from './components/RichText';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const INPUT_REGISTRY: Record<string, React.FC<any>> = {
  text: RNGTextInput,
  password: RNGTextInput,
  number: RNGNumberInput,
  currency: RNGNumberInput,
  switch: RNGSwitch,
  radio: RNGRadioGroup,
  'checkbox-group': RNGCheckboxGroup,
  slider: RNGSlider,
  rating: RNGRating,
  date: RNGDateInput,
  autocomplete: RNGAutocomplete,
  'async-autocomplete': RNGAsyncAutocomplete,
  file: RNGFileUpload,
  'rich-text': RNGRichText,
  'masked-text': RNGMaskedInput,
  calculated: RNGCalculatedField,
  array: RNGArrayField,
};

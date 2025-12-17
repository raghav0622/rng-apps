import {
  RNGCheckboxGroup,
  RNGRadioGroup,
  RNGRating,
  RNGSlider,
  RNGSwitch,
} from './components//SelectionInputs';
import { RNGAutocomplete, RNGDateInput, RNGFileUpload } from './components/AdvancedInputs';
import { RNGArrayField } from './components/ArrayField';
import { RNGAsyncAutocomplete } from './components/AsyncInputs';
import { RNGCalculatedField } from './components/CalculatedField';
import { RNGMaskedInput } from './components/MaskedInput';
import { RNGNumberInput, RNGTextInput } from './components/PrimitiveInputs';
import { RNGRichText } from './components/RichText';
import { FieldType } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const INPUT_REGISTRY: Partial<Record<FieldType, React.ComponentType<any>>> = {
  // Primitives
  text: RNGTextInput,
  password: RNGTextInput,
  number: RNGNumberInput,
  currency: RNGNumberInput,
  date: RNGDateInput,
  'masked-text': RNGMaskedInput,
  calculated: RNGCalculatedField,
  hidden: RNGTextInput, // Fallback, though usually handled explicitly in FormBuilder

  // Selection
  switch: RNGSwitch,
  radio: RNGRadioGroup,
  'checkbox-group': RNGCheckboxGroup,
  slider: RNGSlider,
  rating: RNGRating,
  autocomplete: RNGAutocomplete,
  'async-autocomplete': RNGAsyncAutocomplete,

  // Advanced / Complex
  file: RNGFileUpload,
  'rich-text': RNGRichText,
  array: RNGArrayField,
};

import {
  RNGCheckboxGroup,
  RNGRadioGroup,
  RNGRating,
  RNGSlider,
  RNGSwitch,
  RNGToggleGroup,
} from './components//SelectionInputs';
import {
  RNGAutocomplete,
  RNGDateInput,
  RNGDateRange,
  RNGFileUpload,
  RNGLocation,
  RNGOtpInput,
  RNGSignature,
  RNGTransferList,
} from './components/AdvancedInputs';
import { RNGArrayField } from './components/ArrayField';
import { RNGAsyncAutocomplete } from './components/AsyncInputs';
import { RNGCalculatedField } from './components/CalculatedField';
import { RNGDataGrid } from './components/DataGrid';
import { RNGModalForm, RNGStepperDisplay } from './components/Layouts';
import { RNGMaskedInput } from './components/MaskedInput';
import { RNGColorInput, RNGNumberInput, RNGTextInput } from './components/PrimitiveInputs';
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
  hidden: RNGTextInput,
  color: RNGColorInput, // New
  otp: RNGOtpInput, // New

  // Selection
  switch: RNGSwitch,
  radio: RNGRadioGroup,
  'checkbox-group': RNGCheckboxGroup,
  'toggle-group': RNGToggleGroup, // New
  slider: RNGSlider,
  rating: RNGRating,
  autocomplete: RNGAutocomplete,
  'async-autocomplete': RNGAsyncAutocomplete,
  'transfer-list': RNGTransferList, // New

  // Advanced / Complex
  file: RNGFileUpload,
  'rich-text': RNGRichText,
  signature: RNGSignature, // New
  location: RNGLocation, // New
  'date-range': RNGDateRange, // New

  // Arrays & Layouts
  array: RNGArrayField,
  'data-grid': RNGDataGrid, // New
  stepper: RNGStepperDisplay, // New
  'modal-form': RNGModalForm, // New
};

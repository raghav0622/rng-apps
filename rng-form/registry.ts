import { RNGArrayField } from './components/ArrayField';
import { RNGDataGrid } from './components/DataGrid';
import { RNGAsyncAutocomplete, RNGAutocomplete } from './components/inputs/AutocompleteInputs';
import { RNGCalculatedField } from './components/inputs/CalculatedField';
import { RNGDateInput, RNGDateRange } from './components/inputs/DateInputs';
import { RNGFileUpload } from './components/inputs/FileUpload';
import { RNGLocation } from './components/inputs/Location';
import { RNGColorInput } from './components/inputs/primitives/RNGColorInput';
import { RNGHiddenInput } from './components/inputs/primitives/RNGHiddenInput';
import { RNGNumberInput } from './components/inputs/primitives/RNGNumberInput';
import { RNGTextInput } from './components/inputs/primitives/RNGTextInput';
import { RNGRating, RNGSlider } from './components/inputs/RangeInputs';
import { RNGRichText } from './components/inputs/RichText';
import { RNGCheckboxGroup } from './components/inputs/selection/RNGCheckboxGroup';
import { RNGRadioGroup } from './components/inputs/selection/RNGRadioGroup';
import { RNGSwitch } from './components/inputs/selection/RNGSwitch';
import { RNGToggleGroup } from './components/inputs/selection/RNGToggleGroup';
import { RNGSignature } from './components/inputs/Signature';
import { RNGMaskedInput, RNGOtpInput } from './components/inputs/TextExtendedInputs';
import { RNGTransferList } from './components/inputs/TransferList';
import { RNGModalLayout, RNGStepperLayout } from './components/layouts';
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
  hidden: RNGHiddenInput,
  color: RNGColorInput,
  otp: RNGOtpInput,

  // Selection
  switch: RNGSwitch,
  radio: RNGRadioGroup,
  'checkbox-group': RNGCheckboxGroup,
  'toggle-group': RNGToggleGroup,
  slider: RNGSlider,
  rating: RNGRating,
  autocomplete: RNGAutocomplete,
  'async-autocomplete': RNGAsyncAutocomplete,
  'transfer-list': RNGTransferList,

  // Advanced / Complex
  file: RNGFileUpload,
  'rich-text': RNGRichText,
  signature: RNGSignature,
  location: RNGLocation,
  'date-range': RNGDateRange,

  // Arrays & Layouts
  array: RNGArrayField,
  'data-grid': RNGDataGrid,
  stepper: RNGStepperLayout,
  'modal-form': RNGModalLayout,
};

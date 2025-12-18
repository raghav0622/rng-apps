import React, { lazy, Suspense } from 'react';
import { InputType, LayoutType } from '../types';
import { RNGAutocomplete } from './autocomplete/SyncAutocomplete';
import { RNGDateInput } from './date/DateInput';
import { RNGDateRange } from './date/DateRange';
import {
  RNGAccordionLayout,
  RNGModalLayout,
  RNGSectionLayout,
  RNGStepperLayout,
  RNGTabsLayout,
  RNGWizardLayout,
} from './layouts';
import { RNGColorInput } from './primitives/RNGColorInput';
import { RNGHiddenInput } from './primitives/RNGHiddenInput';
import { RNGNumberInput } from './primitives/RNGNumberInput';
import { RNGTextInput } from './primitives/RNGTextInput';
import { RNGCheckboxGroup } from './selection/RNGCheckboxGroup';
import { RNGRadioGroup } from './selection/RNGRadioGroup';
import { RNGSwitch } from './selection/RNGSwitch';
import { RNGToggleGroup } from './selection/RNGToggleGroup';
import { RNGArrayField } from './special/ArrayField';
import { RNGCalculatedField } from './special/CalculatedField';
import { RNGDataGrid } from './special/DataGrid';
import { RNGFileUpload } from './special/FileUpload';
import { RNGLocation } from './special/Location';
import { RNGRating, RNGSlider } from './special/RangeInputs';
import { RNGRichText } from './special/RichText';
import { RNGSignature } from './special/Signature';
import { RNGMaskedInput, RNGOtpInput } from './special/TextExtendedInputs';
import { RNGTransferList } from './special/TransferList';

// =============================================================================
// LAZY LOADING
// =============================================================================

const withSuspense = <P extends object>(Component: React.ComponentType<P>) => {
  const Wrapped = (props: P) => (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  );
  Wrapped.displayName = `Suspense(${Component.displayName || Component.name})`;
  return Wrapped;
};

// Lazy Imports
const LazyAsyncAutocomplete = lazy(() =>
  import('./autocomplete/AscyncAutocomplete').then((m) => ({
    default: m.RNGAsyncAutocomplete,
  })),
);

// =============================================================================
// REGISTRIES
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
export const INPUT_REGISTRY: Partial<Record<InputType, React.ComponentType<any>>> = {
  // Primitives
  text: RNGTextInput,
  password: RNGTextInput,
  number: RNGNumberInput,
  currency: RNGNumberInput,
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
  'transfer-list': RNGTransferList,

  // Lazy / Advanced
  date: withSuspense(RNGDateInput),
  'date-range': withSuspense(RNGDateRange),
  'async-autocomplete': withSuspense(LazyAsyncAutocomplete),
  file: withSuspense(RNGFileUpload),
  'rich-text': withSuspense(RNGRichText),
  signature: withSuspense(RNGSignature),
  location: withSuspense(RNGLocation),
};

export const LAYOUT_REGISTRY: Record<LayoutType, React.ComponentType<any>> = {
  section: RNGSectionLayout,
  tabs: RNGTabsLayout,
  accordion: RNGAccordionLayout,
  wizard: RNGWizardLayout,
  stepper: RNGStepperLayout,
  'modal-form': RNGModalLayout,
  array: RNGArrayField,
  'data-grid': RNGDataGrid,
};

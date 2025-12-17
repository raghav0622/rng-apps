import React, { lazy, Suspense } from 'react';
import { InputType } from './types';

// =============================================================================
// EAGER IMPORTS (Lightweight Primitives)
// =============================================================================
import { RNGAutocomplete } from './components/inputs/AutocompleteInputs';
import { RNGCalculatedField } from './components/inputs/CalculatedField';
import { RNGColorInput } from './components/inputs/primitives/RNGColorInput';
import { RNGHiddenInput } from './components/inputs/primitives/RNGHiddenInput';
import { RNGNumberInput } from './components/inputs/primitives/RNGNumberInput';
import { RNGTextInput } from './components/inputs/primitives/RNGTextInput';
import { RNGRating, RNGSlider } from './components/inputs/RangeInputs';
import { RNGCheckboxGroup } from './components/inputs/selection/RNGCheckboxGroup';
import { RNGRadioGroup } from './components/inputs/selection/RNGRadioGroup';
import { RNGSwitch } from './components/inputs/selection/RNGSwitch';
import { RNGToggleGroup } from './components/inputs/selection/RNGToggleGroup';
import { RNGMaskedInput, RNGOtpInput } from './components/inputs/TextExtendedInputs';
import { RNGTransferList } from './components/inputs/TransferList';

// =============================================================================
// LAZY IMPORTS (Heavy / Specialized Components)
// =============================================================================

// We use 'any' here for the import promise because we cast strictly in the component usage
/* eslint-disable @typescript-eslint/no-explicit-any */
const RNGAsyncAutocomplete = lazy(() =>
  import('./components/inputs/AutocompleteInputs').then((m) => ({
    default: m.RNGAsyncAutocomplete,
  })),
);
const RNGDateInput = lazy(() =>
  import('./components/inputs/DateInputs').then((m) => ({ default: m.RNGDateInput })),
);
const RNGDateRange = lazy(() =>
  import('./components/inputs/DateInputs').then((m) => ({ default: m.RNGDateRange })),
);
const RNGFileUpload = lazy(() =>
  import('./components/inputs/FileUpload').then((m) => ({ default: m.RNGFileUpload })),
);
const RNGLocation = lazy(() =>
  import('./components/inputs/Location').then((m) => ({ default: m.RNGLocation })),
);
const RNGRichText = lazy(() =>
  import('./components/inputs/RichText').then((m) => ({ default: m.RNGRichText })),
);
const RNGSignature = lazy(() =>
  import('./components/inputs/Signature').then((m) => ({ default: m.RNGSignature })),
);

/**
 * HOC to wrap lazy components with a Suspense fallback.
 * Preserves strict typing for props <P>.
 */
const withSuspense = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => (
    <Suspense>
      <Component {...props} />
    </Suspense>
  );

  // Fixes react/display-name lint error
  WrappedComponent.displayName = `WithSuspense(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
};

// =============================================================================
// REGISTRY
// =============================================================================
// Only includes "Leaf" nodes (inputs) to avoid circular dependencies with FormBuilder
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

  // Lazy Loaded (Advanced)
  date: withSuspense(RNGDateInput),
  'async-autocomplete': withSuspense(RNGAsyncAutocomplete),
  file: withSuspense(RNGFileUpload),
  'rich-text': withSuspense(RNGRichText),
  signature: withSuspense(RNGSignature),
  location: withSuspense(RNGLocation),
  'date-range': withSuspense(RNGDateRange),
};

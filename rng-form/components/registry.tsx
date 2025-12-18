import React, { lazy, Suspense } from 'react';
import { InputType, LayoutType } from '../types';

// =============================================================================
// PRIMITIVES (Direct Imports)
// =============================================================================
import { RNGAutocomplete } from './autocomplete/SyncAutocomplete';
import { RNGDateInput } from './date/DateInput';
import { RNGDateRange } from './date/DateRange';
import { RNGColorInput } from './primitives/RNGColorInput';
import { RNGHiddenInput } from './primitives/RNGHiddenInput';
import { RNGNumberInput } from './primitives/RNGNumberInput';
import { RNGTextInput } from './primitives/RNGTextInput';
import { RNGCheckboxGroup } from './selection/RNGCheckboxGroup';
import { RNGRadioGroup } from './selection/RNGRadioGroup';
import { RNGSwitch } from './selection/RNGSwitch';
import { RNGToggleGroup } from './selection/RNGToggleGroup';
import { RNGCalculatedField } from './special/CalculatedField';
import { RNGFileUpload } from './special/FileUpload';
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

const LazyAsyncAutocomplete = lazy(() =>
  import('./autocomplete/AsyncAutocomplete').then((m) => ({ default: m.RNGAsyncAutocomplete })),
);
const LazySectionLayout = lazy(() =>
  import('./layouts/SectionLayout').then((m) => ({ default: m.RNGSectionLayout })),
);
const LazyTabsLayout = lazy(() =>
  import('./layouts/TabsLayout').then((m) => ({ default: m.RNGTabsLayout })),
);
const LazyAccordionLayout = lazy(() =>
  import('./layouts/AccordionLayout').then((m) => ({ default: m.RNGAccordionLayout })),
);
const LazyWizardLayout = lazy(() =>
  import('./layouts/WizardLayout').then((m) => ({ default: m.RNGWizardLayout })),
);
const LazyStepperLayout = lazy(() =>
  import('./layouts/StepperLayout').then((m) => ({ default: m.RNGStepperLayout })),
);
const LazyModalLayout = lazy(() =>
  import('./layouts/ModalLayout').then((m) => ({ default: m.RNGModalLayout })),
);
const LazyArrayField = lazy(() =>
  import('./special/ArrayField').then((m) => ({ default: m.RNGArrayField })),
);
const LazyDataGrid = lazy(() =>
  import('./special/DataGrid').then((m) => ({ default: m.RNGDataGrid })),
);

// =============================================================================
// REGISTRIES
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
export const INPUT_REGISTRY: Partial<Record<InputType, React.ComponentType<any>>> = {
  // Primitives
  text: RNGTextInput,
  password: RNGTextInput,
  number: RNGNumberInput, // Handles unified number/currency/units

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

  // Advanced
  date: withSuspense(RNGDateInput),
  'date-range': withSuspense(RNGDateRange),
  'async-autocomplete': withSuspense(LazyAsyncAutocomplete),
  file: withSuspense(RNGFileUpload),
  'rich-text': withSuspense(RNGRichText),
  signature: withSuspense(RNGSignature),
  // Removed Location
};

export const LAYOUT_REGISTRY: Record<LayoutType, React.ComponentType<any>> = {
  section: withSuspense(LazySectionLayout),
  tabs: withSuspense(LazyTabsLayout),
  accordion: withSuspense(LazyAccordionLayout),
  wizard: withSuspense(LazyWizardLayout),
  stepper: withSuspense(LazyStepperLayout),
  'modal-form': withSuspense(LazyModalLayout),
  array: withSuspense(LazyArrayField),
  'data-grid': withSuspense(LazyDataGrid),
};

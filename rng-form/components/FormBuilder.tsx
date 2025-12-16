/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useFormContext } from 'react-hook-form';
import { FormItem, FormSchema } from '../types';

// Components
import { RNGAutocomplete, RNGDateInput, RNGFileUpload } from './AdvancedInputs';
import { RNGArrayField } from './ArrayField';
import { RNGAsyncAutocomplete } from './AsyncInputs';
import { RNGCalculatedField } from './CalculatedField'; // NEW
import {
  RNGCheckboxGroup,
  RNGNumberInput,
  RNGRadioGroup,
  RNGRating,
  RNGSlider,
  RNGSwitch,
  RNGTextInput,
} from './Inputs';
import { RNGAccordionLayout, RNGTabsLayout } from './Layouts';
import { RNGMaskedInput } from './MaskedInput'; // NEW
import { RNGRichText } from './RichText';
import { RNGWizard } from './Wizard';

interface FormBuilderProps<S extends FormSchema> {
  uiSchema: FormItem<S>[];
  pathPrefix?: string;
}

export function FormBuilder<S extends FormSchema>({ uiSchema, pathPrefix }: FormBuilderProps<S>) {
  const { register } = useFormContext();

  return (
    <>
      {uiSchema.map((item, index) => {
        const scopedName = pathPrefix && item.name ? `${pathPrefix}.${item.name}` : item.name;
        // Merge dynamic props if using the advanced logic system (Step 1), otherwise just basic item
        const scopedItem = { ...item, name: scopedName } as FormItem<S>;

        switch (item.type) {
          case 'section':
            return (
              <Grid key={index} size={12} sx={{ mt: 2, mb: 1 }}>
                {item.title && (
                  <>
                    <Typography variant="h6" color="primary">
                      {item.title}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </>
                )}
                <Grid container spacing={2}>
                  <FormBuilder uiSchema={item.children} pathPrefix={pathPrefix} />
                </Grid>
              </Grid>
            );

          // Layouts
          case 'tabs':
            return <RNGTabsLayout key={index} item={scopedItem as any} pathPrefix={pathPrefix} />;
          case 'accordion':
            return (
              <RNGAccordionLayout key={index} item={scopedItem as any} pathPrefix={pathPrefix} />
            );
          case 'wizard':
            return <RNGWizard key={index} item={scopedItem as any} pathPrefix={pathPrefix} />;

          // Arrays
          case 'array':
            return <RNGArrayField key={scopedName} item={scopedItem as any} />;

          // Standard Inputs
          case 'text':
          case 'password':
            return <RNGTextInput key={scopedName} item={scopedItem as any} />;
          case 'number':
          case 'currency':
            return <RNGNumberInput key={scopedName} item={scopedItem as any} />;
          case 'switch':
            return <RNGSwitch key={scopedName} item={scopedItem as any} />;
          case 'date':
            return <RNGDateInput key={scopedName} item={scopedItem as any} />;
          case 'autocomplete':
            return <RNGAutocomplete key={scopedName} item={scopedItem as any} />;
          case 'async-autocomplete':
            return <RNGAsyncAutocomplete key={scopedName} item={scopedItem as any} />;
          case 'rich-text':
            return <RNGRichText key={scopedName} item={scopedItem as any} />;
          case 'file':
            return <RNGFileUpload key={scopedName} item={scopedItem as any} />;
          case 'slider':
            return <RNGSlider key={scopedName} item={scopedItem as any} />;
          case 'radio':
            return <RNGRadioGroup key={scopedName} item={scopedItem as any} />;
          case 'rating':
            return <RNGRating key={scopedName} item={scopedItem as any} />;
          case 'checkbox-group':
            return <RNGCheckboxGroup key={scopedName} item={scopedItem as any} />;
          case 'hidden':
            return <input type="hidden" {...register(scopedName as any)} key={scopedName} />;

          // New Feature Inputs
          case 'masked-text':
            return <RNGMaskedInput key={scopedName} item={scopedItem as any} />;
          case 'calculated':
            return <RNGCalculatedField key={scopedName} item={scopedItem as any} />;

          default:
            return null;
        }
      })}
    </>
  );
}

// rng-form/FormContext.ts
'use client';
import { createContext, useContext } from 'react';
import { FieldValues } from 'react-hook-form';
import { FormContextState } from './types';

// Update type to include global readOnly flag
type ExtendedContextState<T extends FieldValues> = FormContextState<T> & {
  readOnly?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Context = createContext<ExtendedContextState<any> | null>(null);

export function useRNGForm() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useRNGForm must be used within RNGForm');
  return ctx;
}

export const RNGFormProvider = Context.Provider;

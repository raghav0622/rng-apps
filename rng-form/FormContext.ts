'use client';
import { createContext, useContext } from 'react';
import { FieldValues } from 'react-hook-form';
import { FormContextState } from './types';

// Default to FieldValues (generic record) instead of any
const Context = createContext<FormContextState<FieldValues> | null>(null);

export function useRNGForm() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useRNGForm must be used within RNGForm');
  return ctx;
}

export const RNGFormProvider = Context.Provider;

'use client';
import { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';

type FormContextType = {
  formId: string;
  methods: UseFormReturn<any>;
};

const Context = createContext<FormContextType | null>(null);

export function useRNGForm() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useRNGForm must be used within RNGForm');
  return ctx;
}

export const RNGFormProvider = Context.Provider;

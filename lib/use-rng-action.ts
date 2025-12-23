import { AppErrorCode } from '@/lib/errors';
import { Result, SuccessResult } from '@/lib/types';
import { FormError } from '@/rng-form';
import { SafeActionFn } from 'next-safe-action';
import { useAction } from 'next-safe-action/hooks';
import { useSnackbar } from 'notistack';
import { z } from 'zod';

type ActionOptions<TInput, TOutput> = {
  onSuccess?: (data: TOutput) => void;
  onError?: (message: string, code?: AppErrorCode) => void;
  successMessage?: string;
  errorMessage?: string;
};

/**
 * A wrapper around useAction that handles the RNG App 'Result<T>' pattern.
 * * Generics:
 * - S: The Zod Schema for input (inferred from action)
 * - O: The Output Data Type (inferred from Result<O>)
 */
export function useRNGServerAction<S extends z.ZodType<any, any, any> | undefined, O>(
  action: SafeActionFn<any, S, any, any, Result<O>>,
  options: ActionOptions<S extends z.ZodType<any, any, any> ? z.infer<S> : void, O> = {},
) {
  const { executeAsync, isExecuting, result, execute, ...rest } = useAction(action);
  const { enqueueSnackbar } = useSnackbar();

  const runAction = async (
    input: S extends z.ZodType<any, any, any> ? z.infer<S> : void,
  ): Promise<O | undefined> => {
    // Return type might be undefined on error
    const response = await executeAsync(input as any);

    // Layer 1: Server Error (e.g., Crash, Timeout, Middleware Error)
    if (response?.serverError) {
      const msg =
        (response.serverError as any)?.message || options.errorMessage || 'Something went wrong';

      if (options.onError) {
        options.onError(msg, (response.serverError as any)?.code as AppErrorCode);
        return; // <--- CRITICAL FIX: Stop execution here
      } else {
        throw new FormError(msg);
      }
    }

    // Layer 2: Application Logic Errors (e.g., Validation, DB Error returned as value)
    const appResult = response?.data;

    if (!appResult) {
      // Guard against completely empty response (rare but possible network failure)
      const msg = options.errorMessage || 'No response from server';
      if (options.onError) {
        options.onError(msg, AppErrorCode.UNKNOWN);
        return;
      }
      throw new FormError(msg);
    }

    if (!appResult.success) {
      const errorMsg = appResult.error.message || options.errorMessage || 'Operation failed';

      if (options.onError) {
        options.onError(errorMsg, appResult.error.code);
        return; // <--- CRITICAL FIX: Stop execution here
      } else {
        throw new FormError(errorMsg);
      }
    }

    // Layer 3: Success Path
    const successResult = appResult as SuccessResult<O>;

    if (options.successMessage) {
      enqueueSnackbar(options.successMessage, { variant: 'success' });
    }

    options.onSuccess?.(successResult.data);
    return successResult.data;
  };

  return {
    runAction,
    isExecuting,
    result,
    execute: runAction,
    ...rest,
  };
}

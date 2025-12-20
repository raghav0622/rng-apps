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
export function useRNGServerAction<
  S extends z.ZodType<any, any, any> | undefined,
  O, // <--- 1. Define O as a standalone generic
>(
  // 2. Force the action's return type to match Result<O>.
  // This forces TS to infer 'O' directly (e.g., 'string' from 'Result<string>')
  action: SafeActionFn<any, S, any, any, Result<O>>,
  options: ActionOptions<S extends z.ZodType<any, any, any> ? z.infer<S> : void, O> = {},
) {
  const { executeAsync, isExecuting, result, ...rest } = useAction(action);
  const { enqueueSnackbar } = useSnackbar();

  // 3. Explicitly type the return Promise using O
  const runAction = async (
    input: S extends z.ZodType<any, any, any> ? z.infer<S> : void,
  ): Promise<O> => {
    const response = await executeAsync(input as any);

    // Layer 1: Server Error
    if (response?.serverError) {
      const msg =
        (response.serverError as any)?.message || options.errorMessage || 'Something went wrong';

      if (options.onError) {
        options.onError(msg, (response.serverError as any)?.code as AppErrorCode);
      } else throw new FormError(msg);
    }

    // Layer 2: Application Logic Errors
    const appResult = response?.data; // Type is automatically Result<O> | undefined

    if (appResult && !appResult.success) {
      const errorMsg = appResult.error.message || options.errorMessage || 'Operation failed';

      if (options.onError) {
        options.onError(errorMsg, appResult.error.code);
      } else throw new FormError(errorMsg);
    }

    // Layer 3: Success Path
    // 4. Safe cast to SuccessResult<O>
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
    ...rest,
  };
}

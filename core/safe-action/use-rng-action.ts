/* eslint-disable @typescript-eslint/no-unused-vars */
import { Result, SuccessResult } from '@/lib/types';
import { AppErrorCode } from '@/lib/utils/errors';
import { FormError } from '@/rng-form';
import { SafeActionFn } from 'next-safe-action';
import { useAction } from 'next-safe-action/hooks';
import { useSnackbar } from 'notistack';
import { z } from 'zod';

// Helper to extract the Schema from the Action Type
type InferSchema<A> = A extends SafeActionFn<any, infer S, any, any, any> ? S : never;

// Helper to extract the actual Data (O) from the Result<O> return type
type InferData<A> =
  A extends SafeActionFn<any, any, any, any, infer R>
    ? R extends Result<infer D>
      ? D
      : never
    : never;

// Helper to determine Input Type (handles Schema vs No Schema)
type InferInput<S> = S extends z.ZodType<any, any, any> ? z.input<S> : void;

type ActionOptions<TInput, TOutput> = {
  /** Callback fired when the action completes successfully */
  onSuccess?: (data: TOutput) => void;
  /** Callback fired when the action fails (server error or logic error) */
  onError?: (message: string, code?: AppErrorCode) => void;
  /** Automatically show a success snackbar with this message */
  successMessage?: string;
  /** Override the default error message from the server */
  errorMessage?: string;
};

/**
 * A wrapper around `useAction` that handles the RNG App 'Result<T>' pattern.
 * Automatically parses the standard `Result` object, handles UI feedback (Snackbars),
 * and throws `FormError` for easy integration with React Hook Form.
 *
 * @template A - The type of the Server Action function.
 * @param {A} action - The server action to execute.
 * @param {ActionOptions} [options] - Configuration for success/error handling.
 * @returns {Object} The execution hooks (runAction, isExecuting, result, etc.).
 *
 * @example
 * const { runAction, isExecuting } = useRNGServerAction(updateUser, {
 * successMessage: "Profile updated!",
 * onSuccess: (user) => console.log(user.id),
 * });
 *
 * // Trigger
 * await runAction({ name: "New Name" });
 */
export function useRNGServerAction<
  // We accept ANY valid SafeAction. strict type checking happens via inference below.
  A extends SafeActionFn<any, any, any, any, any>,
>(action: A, options: ActionOptions<InferInput<InferSchema<A>>, InferData<A>> = {}) {
  // Pass 'action' directly. Since 'A' preserves the exact type, useAction is happy.
  const { executeAsync, isExecuting, result, execute, ...rest } = useAction(action);
  const { enqueueSnackbar } = useSnackbar();

  // We derive the input type strictly from the action's schema
  const runAction = async (
    input: InferInput<InferSchema<A>>,
  ): Promise<InferData<A> | undefined> => {
    // Cast to 'any' is safe here because we enforced strict typing on the 'input' argument above.
    // This bypasses the complex tuple matching logic of executeAsync.
    const response = await executeAsync(input as any);

    // Layer 1: Server Error
    if (response?.serverError) {
      const msg =
        (response.serverError as any)?.message || options.errorMessage || 'Something went wrong';

      if (options.onError) {
        options.onError(msg, (response.serverError as any)?.code as AppErrorCode);
        return;
      } else {
        throw new FormError(msg);
      }
    }

    // Layer 2: Application Logic Errors
    const appResult = response?.data as Result<InferData<A>> | undefined;

    if (!appResult) {
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
        return;
      } else {
        throw new FormError(errorMsg);
      }
    }

    // Layer 3: Success Path
    const successResult = appResult as SuccessResult<InferData<A>>;

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

export const useRngAction = useRNGServerAction
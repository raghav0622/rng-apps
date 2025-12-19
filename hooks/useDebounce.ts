import { debounce } from '@mui/material/utils'; // Or use lodash/debounce
import { useEffect, useMemo, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      debounce((...args: Parameters<T>) => {
        callbackRef.current(...args);
      }, delay),
    [delay],
  );
}

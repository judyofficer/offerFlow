import { useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { mergeJobAutofill } from '../utils/jobAutofill';
import type { JobFields } from '../utils/jobAutofill';
import type { ParsedJobResult } from '../utils/urlJobParser';

export function useJobAutofill<T extends JobFields>(setFields: Dispatch<SetStateAction<T>>) {
  const automatic = useRef<Partial<JobFields>>({});
  return useCallback((parsed: ParsedJobResult, reset = false) => {
    const previous = automatic.current;
    setFields(current => {
      const merged = mergeJobAutofill(current, parsed, previous, reset);
      automatic.current = merged.automatic;
      return merged.fields;
    });
  }, [setFields]);
}

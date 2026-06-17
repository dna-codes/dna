import { useCallback, useRef, useState } from "react";

export interface UseControllableStateParams<T> {
  /** The controlled value. When provided, the hook is in controlled mode. */
  prop?: T;
  /** The initial value used in uncontrolled mode. */
  defaultProp?: T;
  /** Called whenever the value changes, in both controlled and uncontrolled mode. */
  onChange?: (value: T) => void;
}

/**
 * Minimal controlled/uncontrolled state hook mirroring the contract Radix uses
 * for its `value`/`defaultValue`/`onValueChange` props.
 *
 * Kept local (rather than importing `radix-ui/internal`) so the library depends
 * only on the public, externalized `radix-ui` surface — same rationale as the
 * tiny local `clsx`.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T | undefined, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  // Keep the latest onChange without making `setValue` change identity, so it
  // is safe to depend on in effects/callbacks.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      if (next !== value) onChangeRef.current?.(next);
    },
    [isControlled, value],
  );

  return [value, setValue];
}

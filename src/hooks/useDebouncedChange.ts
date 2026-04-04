import { useCallback, useEffect, useRef } from 'react';

export interface UseDebouncedFormValuesChangeOptions<T extends object> {
  /** 需要防抖的字段名 */
  debouncedKeys: string[];
  debounceMs?: number;
  getValues: () => T;
  onApply: (values: T) => void | Promise<void>;
}

export interface UseDebouncedFormValuesChangeResult<T extends object> {
  /** 传给 `<Form onValuesChange={...} />` */
  onValuesChange: (changedValues: Partial<T>, allValues: T) => void;
  /** 重置表单等场景下取消尚未执行的防抖任务 */
  cancelPending: () => void;
}

/**
 * 指定字段输入防抖，其余字段（如日期、下拉）立即生效。
 */
export function useDebouncedChange<T extends object>(
  options: UseDebouncedFormValuesChangeOptions<T>
): UseDebouncedFormValuesChangeResult<T> {
  const { debouncedKeys, debounceMs = 400, getValues, onApply } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getValuesRef = useRef(getValues);
  const onApplyRef = useRef(onApply);
  getValuesRef.current = getValues;
  onApplyRef.current = onApply;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onValuesChange = useCallback(
    (changedValues: Partial<T>) => {
      const needsDebounce = debouncedKeys.some((key) =>
        Object.prototype.hasOwnProperty.call(changedValues, key)
      );
      if (needsDebounce) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          void onApplyRef.current(getValuesRef.current());
        }, debounceMs);
      } else {
        void onApplyRef.current(getValuesRef.current());
      }
    },
    [debouncedKeys, debounceMs]
  );

  return { onValuesChange, cancelPending };
}

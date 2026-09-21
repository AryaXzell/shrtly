/**
 * Utility & hook for tactile haptic feedback on mobile devices via the Web Vibration API.
 */

export type HapticType =
  | 'selection'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  selection: 8,
  light: 14,
  medium: 24,
  heavy: 42,
  success: [12, 45, 22],
  warning: [25, 35, 25],
  error: [35, 50, 35],
};

/**
 * Triggers haptic vibration if supported by the browser/device.
 */
export function triggerHaptic(type: HapticType = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      const pattern = HAPTIC_PATTERNS[type] ?? 14;
      return navigator.vibrate(pattern);
    }
  } catch {
    // Graceful degradation when vibration is disallowed or restricted
  }
  return false;
}

export const haptic = {
  selection: () => triggerHaptic('selection'),
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
};

/**
 * React hook to access haptic feedback utilities.
 */
export function useHaptics() {
  return {
    trigger: triggerHaptic,
    selection: haptic.selection,
    light: haptic.light,
    medium: haptic.medium,
    heavy: haptic.heavy,
    success: haptic.success,
    warning: haptic.warning,
    error: haptic.error,
  };
}

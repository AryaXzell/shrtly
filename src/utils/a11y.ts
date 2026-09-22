import { useEffect, useRef } from 'react';

/**
 * Custom React Hook for accessibility (Focus Trap, Escape close, Focus Return)
 * in Shrtly modals.
 */
export function useModalA11y(isOpen: boolean, onClose: () => void, containerId: string) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember previous active element to restore focus on close (A3)
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Set focus to the modal container or first input/control inside it (A3)
    const timer = setTimeout(() => {
      const container = document.getElementById(containerId);
      if (container) {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
        
        if (focusableElements.length > 0) {
          const firstInput = Array.from(focusableElements).find(el => el.tagName === 'INPUT');
          if (firstInput) {
            firstInput.focus();
          } else {
            focusableElements[0].focus();
          }
        } else {
          container.focus();
        }
      }
    }, 50);

    // Escape key (A2) and Focus Trap (A3) handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
        
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original trigger element (A3)
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose, containerId]);
}

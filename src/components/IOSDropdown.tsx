import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { haptic } from '../utils/haptics';

export interface IOSDropdownOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface IOSDropdownProps<T extends string = string> {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: IOSDropdownOption<T>[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  fullWidth?: boolean;
  align?: 'left' | 'right';
  disabled?: boolean;
  ariaLabel?: string;
}

export function IOSDropdown<T extends string = string>({
  id,
  value,
  onChange,
  options,
  icon,
  placeholder = 'Pilih...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  fullWidth = false,
  align = 'left',
  disabled = false,
  ariaLabel,
}: IOSDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        const currentIndex = options.findIndex((opt) => opt.value === value);
        if (e.key === 'ArrowDown') {
          const nextIndex = (currentIndex + 1) % options.length;
          onChange(options[nextIndex].value);
        } else {
          const prevIndex = (currentIndex - 1 + options.length) % options.length;
          onChange(options[prevIndex].value);
        }
      }
    },
    [disabled, isOpen, onChange, options, value]
  );

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* iOS Styled Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          haptic.selection();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl border transition-all text-xs font-medium select-none cursor-pointer active:scale-[0.98] ${
          fullWidth ? 'w-full' : ''
        } ${
          isOpen
            ? 'border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/10 bg-white dark:bg-neutral-900 shadow-md'
            : 'border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
        } ${disabled ? 'opacity-40 pointer-events-none' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-neutral-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="text-neutral-500 dark:text-neutral-400 shrink-0">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate text-neutral-800 dark:text-neutral-200">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-neutral-400 shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5 stroke-[2.2]" />
        </motion.div>
      </button>

      {/* iOS Floating Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -3 }}
            transition={{
              type: 'spring',
              stiffness: 450,
              damping: 32,
              mass: 0.7,
            }}
            role="listbox"
            tabIndex={-1}
            className={`absolute z-50 mt-1.5 min-w-[170px] ${
              fullWidth ? 'w-full' : 'w-auto'
            } ${
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
            } rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-1.5 space-y-0.5 max-h-64 overflow-y-auto ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    haptic.selection();
                    onChange(opt.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs text-left transition-all select-none cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850 active:bg-neutral-100 dark:active:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && (
                      <span className="text-neutral-500 dark:text-neutral-400 shrink-0">
                        {opt.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <div className="truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[10px] text-neutral-400 font-normal truncate">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="text-neutral-900 dark:text-white shrink-0 ml-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

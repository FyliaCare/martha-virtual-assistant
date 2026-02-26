// ============================================================
// Input & AmountInput Components
// ============================================================

import { forwardRef, type InputHTMLAttributes } from 'react';
import { CURRENCY_SYMBOL } from '../../utils/constants';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white border border-border rounded-xl
              px-4 py-3 text-sm text-text-primary
              placeholder:text-text-light
              focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
              transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-alert ring-1 ring-alert/20' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-alert mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ---- Amount Input (Currency Formatted) ----

interface AmountInputProps extends Omit<InputProps, 'type' | 'icon'> {
  currency?: string;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ currency = CURRENCY_SYMBOL, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        icon={
          <span className="text-sm font-semibold text-gold">{currency}</span>
        }
        {...props}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';

export default Input;

'use client';

import { useState, useEffect } from 'react';
import { validateField, ValidationRule } from '@/utils/formValidation';

interface ValidatedInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  rules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}

export default function ValidatedInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  rules = [],
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (touched) {
      const result = validateField(value, rules);
      setErrors(result.errors);
      setShowSuccess(result.isValid && value !== '');
    }
  }, [value, rules, touched]);

  const handleBlur = () => {
    setTouched(true);
    const result = validateField(value, rules);
    setErrors(result.errors);
    setShowSuccess(result.isValid && value !== '');
  };

  const hasError = touched && errors.length > 0;

  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--foreground)' }}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all outline-none ${
            hasError
              ? 'border-red-500 focus:ring-2 focus:ring-red-500'
              : showSuccess
              ? 'border-green-500 focus:ring-2 focus:ring-green-500'
              : 'focus:ring-2 focus:ring-opacity-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: hasError
              ? '#ef4444'
              : showSuccess
              ? '#22c55e'
              : 'var(--input-border)',
            color: 'var(--foreground)',
          }}
        />

        {showSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}

        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {hasError && (
        <div
          id={`${name}-error`}
          role="alert"
          className="mt-1.5 space-y-1"
        >
          {errors.map((error, index) => (
            <p
              key={index}
              className="text-sm text-red-600 flex items-start gap-1"
            >
              <span className="mt-0.5">•</span>
              <span>{error}</span>
            </p>
          ))}
        </div>
      )}

      {!hasError && touched && value !== '' && rules.length > 0 && showSuccess && (
        <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Looks good!</span>
        </p>
      )}
    </div>
  );
}

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}

function FieldWrapper({ label, error, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

const baseInputClasses =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100';

function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function InputField({ label, error, id, className = '', ...rest }: InputFieldProps) {
  const fieldId = id ?? slugifyLabel(label);
  return (
    <FieldWrapper label={label} error={error} htmlFor={fieldId}>
      <input id={fieldId} className={`${baseInputClasses} ${className}`} {...rest} />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextAreaField({ label, error, id, className = '', ...rest }: TextAreaFieldProps) {
  const fieldId = id ?? slugifyLabel(label);
  return (
    <FieldWrapper label={label} error={error} htmlFor={fieldId}>
      <textarea id={fieldId} className={`${baseInputClasses} min-h-24 resize-y ${className}`} {...rest} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function SelectField({ label, error, id, className = '', children, ...rest }: SelectFieldProps) {
  const fieldId = id ?? slugifyLabel(label);
  return (
    <FieldWrapper label={label} error={error} htmlFor={fieldId}>
      <select id={fieldId} className={`${baseInputClasses} bg-white ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

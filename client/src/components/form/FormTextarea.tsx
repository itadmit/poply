import React from 'react';

interface FormTextareaProps {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  rows = 4,
  className = ''
}) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
        placeholder={placeholder}
      />
    </div>
  );
};

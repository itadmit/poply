import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FormSelectProps {
  id: string;
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  className = '',
  children
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          required={required}
          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none bg-white"
        >
          {children}
        </select>
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

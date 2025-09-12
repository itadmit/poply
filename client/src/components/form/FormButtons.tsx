import React from 'react';

interface FormButtonsProps {
  submitText: string;
  cancelText?: string;
  onCancel: () => void;
  loading?: boolean;
}

export const FormButtons: React.FC<FormButtonsProps> = ({
  submitText,
  cancelText = 'ביטול',
  onCancel,
  loading = false
}) => {
  return (
    <div className="mt-6 flex gap-3 flex-row-reverse">
      <button
        type="submit"
        disabled={loading}
        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            שולח...
          </>
        ) : (
          submitText
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors"
      >
        {cancelText}
      </button>
    </div>
  );
};

import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        id={inputId}
        className={`w-full min-h-12 px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-400
          bg-white text-sm transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent
          ${error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200'}
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}`}
      />
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
});

export default Input;

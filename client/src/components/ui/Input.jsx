import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400
          bg-white text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          ${error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200'}
          disabled:bg-gray-50 disabled:text-gray-500
          ${className}`}
      />
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
});

export default Input;

import Spinner from './Spinner';

const variants = {
  primary:   'bg-fseg-green  text-white  hover:bg-fseg-dark   active:bg-fseg-dark   disabled:bg-gray-300',
  secondary: 'bg-white       text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50',
  danger:    'bg-red-600     text-white  hover:bg-red-700     active:bg-red-800     disabled:bg-gray-300',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100  disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3   text-base',
};

export default function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <Spinner size="sm" color={variant === 'primary' ? 'text-white' : 'text-gray-600'} /> : null}
      {children}
    </button>
  );
}

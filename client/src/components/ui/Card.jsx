export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between p-4 border-b border-gray-100">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

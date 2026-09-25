import { useToastStore } from '../../store/toastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-500   shrink-0" />,
  info:    <Info       className="w-5 h-5 text-blue-500  shrink-0" />,
};

const colors = {
  success: 'border-green-200 bg-white',
  error:   'border-red-200   bg-white',
  info:    'border-blue-200  bg-white',
};

export default function Toast() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-slide-up ${colors[t.type]}`}
        >
          {icons[t.type]}
          <span className="text-sm font-medium text-gray-800 flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

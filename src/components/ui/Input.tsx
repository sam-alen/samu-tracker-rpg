import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const baseClass =
  'w-full bg-[#05070D] border border-[#1B2A47] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold-400/60 focus:shadow-[0_0_8px_rgba(77,166,255,0.15)] transition-all';

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">{label}</label>}
      <input {...props} className={`${baseClass} ${error ? 'border-red-700' : ''} ${className}`} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">{label}</label>}
      <textarea {...props} rows={props.rows ?? 3} className={`${baseClass} resize-none ${error ? 'border-red-700' : ''} ${className}`} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide">{label}</label>}
      <select {...props} className={`${baseClass} ${className}`}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

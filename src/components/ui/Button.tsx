import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: `bg-gradient-to-b from-gold-300 to-gold-500 hover:from-gold-200 hover:to-gold-400
    text-[#03101F] font-semibold border border-gold-200/60
    shadow-[0_0_12px_rgba(77,166,255,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]`,
  secondary: `bg-[#101B31] hover:bg-[#14233E] text-gray-200 border border-[#2B4066]
    hover:border-gold-400/40 shadow-[inset_0_1px_0_rgba(232,241,255,0.05)]`,
  danger: 'bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-900/60',
  ghost: 'bg-transparent hover:bg-[#101B31] text-gray-400 hover:text-gold-200 border border-transparent',
  success: 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/60',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px
        ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

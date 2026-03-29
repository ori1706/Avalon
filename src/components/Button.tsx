import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'good' | 'evil' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses = {
  primary: 'bg-avalon-gold text-avalon-darker hover:bg-avalon-gold-light',
  secondary: 'bg-avalon-slate text-white hover:bg-avalon-slate/80',
  danger: 'bg-avalon-evil text-white hover:bg-avalon-evil-light',
  good: 'bg-avalon-good text-white hover:bg-avalon-good-light',
  evil: 'bg-avalon-evil text-white hover:bg-avalon-evil-light',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/5',
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`
        font-semibold transition-all duration-200
        active:scale-95 disabled:opacity-40 disabled:active:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

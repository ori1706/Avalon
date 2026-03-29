import type { Alignment } from '../game/types'

interface PlayerAvatarProps {
  name: string
  isLeader?: boolean
  isSelected?: boolean
  alignment?: Alignment
  showAlignment?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
}

export function PlayerAvatar({
  name,
  isLeader,
  isSelected,
  alignment,
  showAlignment,
  size = 'md',
  onClick,
  disabled,
}: PlayerAvatarProps) {
  const initial = name.charAt(0).toUpperCase()

  let borderColor = 'border-avalon-slate'
  if (isSelected) borderColor = 'border-avalon-gold'
  if (showAlignment && alignment === 'good') borderColor = 'border-avalon-good'
  if (showAlignment && alignment === 'evil') borderColor = 'border-avalon-evil'

  let bgColor = 'bg-avalon-navy'
  if (showAlignment && alignment === 'good') bgColor = 'bg-avalon-good/20'
  if (showAlignment && alignment === 'evil') bgColor = 'bg-avalon-evil/20'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        relative flex items-center justify-center rounded-full border-2 font-bold
        transition-all duration-200
        ${sizeClasses[size]}
        ${borderColor}
        ${bgColor}
        ${onClick && !disabled ? 'active:scale-95 cursor-pointer' : 'cursor-default'}
        ${disabled ? 'opacity-40' : ''}
        ${isSelected ? 'ring-2 ring-avalon-gold/50 scale-110' : ''}
      `}
    >
      {initial}
      {isLeader && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-avalon-gold rounded-full flex items-center justify-center text-xs text-avalon-darker">
          &#9818;
        </span>
      )}
    </button>
  )
}

interface PlayerAvatarWithNameProps extends PlayerAvatarProps {
  subtitle?: string
}

export function PlayerAvatarWithName({
  subtitle,
  ...props
}: PlayerAvatarWithNameProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <PlayerAvatar {...props} />
      <span className="text-xs text-slate-300 truncate max-w-16 text-center">
        {props.name}
      </span>
      {subtitle && (
        <span className="text-xs text-avalon-gold truncate max-w-20 text-center">
          {subtitle}
        </span>
      )}
    </div>
  )
}

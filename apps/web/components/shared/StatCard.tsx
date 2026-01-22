import * as React from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info'
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className,
  ...props
}: StatCardProps) {
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    primary: 'gradient-primary text-white border-transparent',
    success: 'gradient-success text-white border-transparent',
    warning: 'gradient-warning text-white border-transparent',
    info: 'gradient-info text-white border-transparent',
  }

  const isGradient = variant !== 'default'

  return (
    <div
      className={cn(
        'rounded-xl border p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]',
        variantClasses[variant],
        isGradient ? 'shadow-lg' : 'card-shadow bg-white dark:bg-gray-800',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn('text-sm font-medium', isGradient ? 'text-white/90' : 'text-gray-600 dark:text-gray-400')}>
            {title}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-bold',
              isGradient ? 'text-white' : 'text-gray-900 dark:text-white'
            )}
          >
            {value}
          </p>
          {description && (
            <p className={cn('mt-1 text-xs', isGradient ? 'text-white/80' : 'text-gray-500 dark:text-gray-400')}>
              {description}
            </p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend.positive
                    ? 'text-green-600'
                    : 'text-red-600',
                  isGradient && (trend.positive ? 'text-green-100' : 'text-red-100')
                )}
              >
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={cn('text-xs', isGradient ? 'text-white/70' : 'text-gray-500 dark:text-gray-400')}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'rounded-lg p-3',
              isGradient ? 'bg-white/20' : 'bg-primary/10'
            )}
          >
            <div className={cn('h-6 w-6', isGradient ? 'text-white' : 'text-primary')}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'

interface EmptyStateProps {
  icon: IconName
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="col-span-full py-14 text-center">
      <div className="mb-3 flex justify-center text-accent-ink/70">
        <Icon name={icon} className="size-14" />
      </div>
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

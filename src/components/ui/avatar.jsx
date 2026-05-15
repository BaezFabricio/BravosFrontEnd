'use client'

import { cn } from '@/lib/utils'

function Avatar({
  className,
  children,
  ...props
}) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function AvatarImage({
  className,
  alt = '',
  ...props
}) {
  return (
    <img
      data-slot="avatar-image"
      alt={alt}
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }

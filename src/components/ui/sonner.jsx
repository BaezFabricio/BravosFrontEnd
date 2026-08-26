import { Toaster as Sonner } from 'sonner'

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="top-right"
      theme="dark"
      closeButton
      gap={8}
      toastOptions={{
        style: {
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          color: 'var(--card-foreground)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          fontFamily: 'inherit',
        },
        classNames: {
          toast: 'border-l-[3px] !border-l-[var(--border)]',
          title: 'font-bold text-sm tracking-wide',
          description: 'text-xs opacity-60 mt-0.5 leading-relaxed',
          closeButton: '!bg-[var(--secondary)] !border-[var(--border)] !text-[var(--muted-foreground)]',
          success: '!border-l-emerald-500',
          error: '!border-l-red-500',
          warning: '!border-l-amber-400',
          info: '!border-l-blue-500',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

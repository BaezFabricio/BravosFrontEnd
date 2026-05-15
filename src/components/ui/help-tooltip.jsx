import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function HelpTooltip({ 
  content, 
  side = "top", 
  className,
  iconClassName 
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-accent transition-colors",
            className
          )}
        >
          <HelpCircle className={cn("h-4 w-4", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className="max-w-xs bg-card border border-border text-card-foreground shadow-lg p-3"
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function FieldLabel({ label, helpText, required, htmlFor }) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <HelpTooltip content={helpText} />
    </div>
  )
}

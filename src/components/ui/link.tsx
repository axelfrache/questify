import { cn } from "@/lib/utils"
import { ComponentPropsWithoutRef, forwardRef } from "react"

export interface LinkProps extends ComponentPropsWithoutRef<"a"> {
  href: string
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "transition-colors hover:text-foreground/80",
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)
Link.displayName = "Link"

export { Link } 
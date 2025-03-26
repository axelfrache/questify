import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-full border bg-background p-2 px-6 text-center font-semibold",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-primary transition-all duration-300 scale-x-0 group-hover:scale-x-100 origin-left" />
      <div className="relative z-10 flex items-center justify-center gap-2">
        <span className="transition-all duration-300 group-hover:text-primary-foreground">
          {children}
        </span>
        <ArrowRight 
          className="h-4 w-4 transform transition-all duration-300 translate-x-[-100%] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary-foreground" 
        />
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

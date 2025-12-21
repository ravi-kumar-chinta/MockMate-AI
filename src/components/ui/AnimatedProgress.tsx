import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "warning" | "danger" | "brand";
  animated?: boolean;
  showValue?: boolean;
}

const AnimatedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  AnimatedProgressProps
>(({ className, value, variant = "default", animated = false, showValue = false, ...props }, ref) => {
  const variantClasses = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    brand: "gradient-brand",
  };

  const getVariant = (val: number) => {
    if (variant !== "default") return variant;
    if (val >= 70) return "success";
    if (val >= 50) return "warning";
    return "danger";
  };

  const currentVariant = getVariant(value || 0);

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full flex-1 transition-all duration-500 ease-out rounded-full",
            variantClasses[currentVariant],
            animated && "progress-animated"
          )}
          style={{ width: `${value || 0}%` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <span className="absolute right-0 -top-6 text-sm font-medium text-foreground">
          {value}%
        </span>
      )}
    </div>
  );
});

AnimatedProgress.displayName = "AnimatedProgress";

export { AnimatedProgress };

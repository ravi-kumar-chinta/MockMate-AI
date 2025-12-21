import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "glass";
  hover?: "lift" | "glow" | "scale" | "none";
  delay?: number;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = "default", hover = "lift", delay = 0, style, children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-card border border-border",
      gradient: "gradient-card border border-border/50",
      glass: "glass border border-border/30",
    };

    const hoverClasses = {
      lift: "hover-lift hover:border-primary/30",
      glow: "hover-glow hover:border-primary/30",
      scale: "hover-scale",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl shadow-md animate-fade-in-up",
          variantClasses[variant],
          hoverClasses[hover],
          className
        )}
        style={{
          animationDelay: `${delay}ms`,
          animationFillMode: "backwards",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };

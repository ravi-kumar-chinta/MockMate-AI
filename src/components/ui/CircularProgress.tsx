import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
}

export const CircularProgress = ({
  value,
  max = 100,
  size = "md",
  strokeWidth = 8,
  className,
  showValue = true,
  label,
}: CircularProgressProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  const sizeMap = {
    sm: 80,
    md: 120,
    lg: 160,
  };
  
  const diameter = sizeMap[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(animatedValue / max, 1);
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const getScoreColor = () => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "text-success stroke-success";
    if (percentage >= 60) return "text-primary stroke-primary";
    if (percentage >= 40) return "text-warning stroke-warning";
    return "text-destructive stroke-destructive";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn("transition-all duration-1000 ease-out", getScoreColor())}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "font-bold transition-colors duration-300",
            size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-3xl",
            getScoreColor()
          )}>
            {Math.round(animatedValue)}
          </span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
};

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  delay = 0,
  className,
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg animate-fade-in-up h-full flex flex-col justify-center",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Background decoration */}
      <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-primary/5 transition-transform duration-300" />
      
      <div className="relative flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5 gradient-brand-light flex-shrink-0", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {trend === "up" && (
            <>
              <svg className="h-3 w-3 text-success" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 3l4 5H2l4-5z" />
              </svg>
              <span className="text-success">Improving</span>
            </>
          )}
          {trend === "down" && (
            <>
              <svg className="h-3 w-3 text-destructive" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9l4-5H2l4 5z" />
              </svg>
              <span className="text-destructive">Needs work</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

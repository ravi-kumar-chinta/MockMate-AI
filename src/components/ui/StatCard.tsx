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
        "relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in-up",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3 gradient-brand-light", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
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

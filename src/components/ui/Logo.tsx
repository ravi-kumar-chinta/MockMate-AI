import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-xl gradient-brand shadow-brand transition-all duration-300 hover:shadow-brand-lg",
        sizeClasses[size]
      )}>
        {/* MockMate AI Icon - Stylized "M" with AI accent */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3"
        >
          <path
            d="M6 24V10L11 18L16 10L21 18L26 10V24"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="8" r="3" fill="hsl(var(--accent))" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold tracking-tight text-foreground leading-none",
            textSizeClasses[size]
          )}>
            MockMate
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            AI Interview Coach
          </span>
        </div>
      )}
    </div>
  );
};

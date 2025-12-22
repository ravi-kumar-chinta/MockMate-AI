import { cn } from "@/lib/utils";
import mockmateLogo from "@/assets/mockmate-logo.png";

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
      <img
        src={mockmateLogo}
        alt="MockMate AI"
        className={cn(
          "object-contain transition-transform duration-300 hover:scale-105",
          sizeClasses[size]
        )}
      />
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

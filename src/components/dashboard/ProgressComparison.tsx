import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgress } from "@/components/ui/AnimatedProgress";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface ProgressComparisonProps {
  firstAttemptScore: number | null;
  latestAttemptScore: number | null;
  totalInterviews: number;
}

export const ProgressComparison = ({ 
  firstAttemptScore, 
  latestAttemptScore, 
  totalInterviews 
}: ProgressComparisonProps) => {
  const improvement = (firstAttemptScore !== null && latestAttemptScore !== null) 
    ? latestAttemptScore - firstAttemptScore 
    : 0;

  return (
    <AnimatedCard delay={300} className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <BarChart3 className="w-4 h-4 text-accent" />
          </div>
          Your Progress
        </CardTitle>
        <CardDescription>Comparing your first and latest performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalInterviews < 2 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Complete at least 2 sessions to see your progress comparison
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* First Attempt */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">First Session</p>
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50">
                  <span className="text-xl font-bold text-foreground">
                    {firstAttemptScore?.toFixed(1) || "N/A"}
                  </span>
                </div>
              </div>
              
              {/* Latest Attempt */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Latest Session</p>
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full gradient-brand shadow-brand">
                  <span className="text-xl font-bold text-primary-foreground">
                    {latestAttemptScore?.toFixed(1) || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Improvement Indicator */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50">
              {improvement > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="font-semibold text-sm text-success">
                    +{improvement.toFixed(1)} pts improvement
                  </span>
                </>
              ) : improvement < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="font-semibold text-sm text-destructive">
                    {improvement.toFixed(1)} pts change
                  </span>
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm text-muted-foreground">
                    Same score - keep practicing!
                  </span>
                </>
              )}
            </div>

            {/* Progress Bar Visualization */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">First</span>
                  <span className="font-medium">{firstAttemptScore?.toFixed(1)}/10</span>
                </div>
                <AnimatedProgress value={(firstAttemptScore || 0) * 10} variant="default" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Latest</span>
                  <span className="font-medium">{latestAttemptScore?.toFixed(1)}/10</span>
                </div>
                <AnimatedProgress value={(latestAttemptScore || 0) * 10} variant="brand" />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

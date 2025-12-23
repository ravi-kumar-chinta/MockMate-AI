import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ReadinessScoreProps {
  score: number;
  previousScore?: number;
  totalInterviews: number;
}

export const ReadinessScore = ({ score, previousScore, totalInterviews }: ReadinessScoreProps) => {
  const scoreDiff = previousScore !== undefined ? score - previousScore : 0;
  
  const getTrendIcon = () => {
    if (scoreDiff > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (scoreDiff < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getReadinessLevel = () => {
    if (score >= 80) return { label: "Interview Ready", color: "text-success" };
    if (score >= 60) return { label: "Good Progress", color: "text-primary" };
    if (score >= 40) return { label: "Keep Practicing", color: "text-warning" };
    return { label: "Just Starting", color: "text-muted-foreground" };
  };

  const readinessLevel = getReadinessLevel();

  return (
    <AnimatedCard variant="gradient" delay={50} className="overflow-hidden h-full min-h-full">
      <CardContent className="flex flex-col items-center justify-center h-full py-6 px-4">
        <p className="text-sm font-semibold text-muted-foreground mb-4">Interview Readiness</p>
        <CircularProgress
          value={score}
          max={100}
          size="lg"
          label="/ 100"
        />
        <div className="mt-4 text-center">
          <p className={`text-base font-bold ${readinessLevel.color}`}>
            {readinessLevel.label}
          </p>
          {previousScore !== undefined && totalInterviews > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-sm">
              {getTrendIcon()}
              <span className={scoreDiff >= 0 ? "text-success" : "text-destructive"}>
                {scoreDiff >= 0 ? "+" : ""}{scoreDiff.toFixed(0)} pts
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </AnimatedCard>
  );
};

import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Target, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";

interface ImprovementPlanProps {
  weakAreas: string[];
  suggestedTopics: string[];
  nextSteps: string[];
  hasEnoughData: boolean;
}

export const ImprovementPlan = ({ 
  weakAreas, 
  suggestedTopics, 
  nextSteps,
  hasEnoughData 
}: ImprovementPlanProps) => {
  if (!hasEnoughData) {
    return (
      <AnimatedCard delay={200}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            AI Improvement Plan
          </CardTitle>
          <CardDescription>Complete more interviews to unlock personalized suggestions</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Complete at least 3 interview sessions to get your personalized improvement plan
          </p>
          <Link to="/interview">
            <GradientButton size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Start Practicing
            </GradientButton>
          </Link>
        </CardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard delay={200}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          AI Improvement Plan
        </CardTitle>
        <CardDescription>Personalized recommendations based on your performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-warning" />
              Areas to Focus On
            </h4>
            <div className="flex flex-wrap gap-2">
              {weakAreas.map((area, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-warning/10 text-warning text-xs font-medium rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Topics */}
        {suggestedTopics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              Topics to Study
            </h4>
            <ul className="space-y-2">
              {suggestedTopics.map((topic, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-success" />
              Suggested Next Steps
            </h4>
            <ul className="space-y-2">
              {nextSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-success">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

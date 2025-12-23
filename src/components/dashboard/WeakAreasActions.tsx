import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Target, ArrowRight, BookOpen, MessageSquare, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";

interface WeakAreasActionsProps {
  weakAreas: string[];
  mcqAccuracy: number;
  normalAvgScore: number;
  totalInterviews: number;
}

export const WeakAreasActions = ({
  weakAreas,
  mcqAccuracy,
  normalAvgScore,
  totalInterviews,
}: WeakAreasActionsProps) => {
  const generateActions = () => {
    const actions: { icon: typeof AlertTriangle; text: string; priority: "high" | "medium" | "low" }[] = [];

    if (mcqAccuracy < 60) {
      actions.push({
        icon: BookOpen,
        text: "Practice more MCQ questions to improve quick thinking",
        priority: "high",
      });
    } else if (mcqAccuracy < 80) {
      actions.push({
        icon: BookOpen,
        text: "Continue MCQ practice to reach 80%+ accuracy",
        priority: "medium",
      });
    }

    if (normalAvgScore < 6) {
      actions.push({
        icon: MessageSquare,
        text: "Focus on descriptive questions to improve answer clarity",
        priority: "high",
      });
    } else if (normalAvgScore < 7.5) {
      actions.push({
        icon: MessageSquare,
        text: "Refine descriptive answers with more specific examples",
        priority: "medium",
      });
    }

    if (totalInterviews < 5) {
      actions.push({
        icon: Target,
        text: "Complete at least 5 sessions for comprehensive insights",
        priority: "medium",
      });
    }

    if (actions.length === 0) {
      actions.push({
        icon: Lightbulb,
        text: "Challenge yourself with harder difficulty levels",
        priority: "low",
      });
    }

    return actions.slice(0, 3);
  };

  const actions = generateActions();
  const hasData = totalInterviews > 0;

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "text-destructive bg-destructive/10";
      case "medium":
        return "text-warning bg-warning/10";
      case "low":
        return "text-success bg-success/10";
    }
  };

  return (
    <AnimatedCard variant="gradient" delay={300} className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <AlertTriangle className="w-4 h-4 text-primary" />
          </div>
          Weak Areas & Next Actions
        </CardTitle>
        <CardDescription>AI-identified focus areas and suggestions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <>
            {/* Weak Areas */}
            {weakAreas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Focus Areas</p>
                <div className="flex flex-wrap gap-2">
                  {weakAreas.slice(0, 3).map((area, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs rounded-full bg-warning/10 text-warning font-medium animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {area.length > 30 ? area.substring(0, 30) + "..." : area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Next Actions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Actions</p>
              <ul className="space-y-2">
                {actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 animate-slide-in-right"
                    style={{ animationDelay: `${(i + 1) * 100}ms` }}
                  >
                    <div className={`p-1.5 rounded-md flex-shrink-0 ${getPriorityColor(action.priority)}`}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-foreground leading-tight">{action.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Link to="/interview" className="block pt-2">
              <GradientButton size="sm" className="w-full group">
                Start Practice Session
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </>
        ) : (
          <div className="text-center py-8">
            <Target className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Complete your first interview to see personalized insights
            </p>
            <Link to="/interview">
              <GradientButton size="sm">
                Start First Interview
                <ArrowRight className="w-4 h-4 ml-2" />
              </GradientButton>
            </Link>
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatedProgress } from "@/components/ui/AnimatedProgress";
import { GradientButton } from "@/components/ui/GradientButton";
import { 
  Play, History, TrendingUp, Target, Award, Brain, 
  BarChart3, Sparkles, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";

interface DashboardStats {
  totalInterviews: number;
  averageScore: number;
  mcqAccuracy: number;
  normalAvgScore: number;
  recentSessions: any[];
  strengths: string[];
  weaknesses: string[];
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInterviews: 0,
    averageScore: 0,
    mcqAccuracy: 0,
    normalAvgScore: 0,
    recentSessions: [],
    strengths: [],
    weaknesses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (profileData) setProfile(profileData);

    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: questions } = await supabase
      .from("interview_questions")
      .select("*")
      .eq("user_id", user.id);

    if (sessions && questions) {
      const completedSessions = sessions.filter(s => s.completed);
      const mcqQuestions = questions.filter(q => q.question_mode === "MCQ");
      const normalQuestions = questions.filter(q => q.question_mode === "Normal");

      const mcqCorrect = mcqQuestions.filter(q => q.is_correct).length;
      const mcqTotal = mcqQuestions.length;
      const normalScores = normalQuestions.filter(q => q.score !== null).map(q => Number(q.score));

      const avgNormal = normalScores.length > 0 
        ? normalScores.reduce((a, b) => a + b, 0) / normalScores.length 
        : 0;

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      questions.forEach(q => {
        if (q.feedback && typeof q.feedback === 'object') {
          const feedback = q.feedback as any;
          if (feedback.strengths) {
            strengths.push(...(Array.isArray(feedback.strengths) ? feedback.strengths : [feedback.strengths]));
          }
          if (feedback.improvements) {
            weaknesses.push(...(Array.isArray(feedback.improvements) ? feedback.improvements : [feedback.improvements]));
          }
        }
      });

      setStats({
        totalInterviews: completedSessions.length,
        averageScore: completedSessions.length > 0 
          ? completedSessions.reduce((a, b) => a + Number(b.average_score), 0) / completedSessions.length 
          : 0,
        mcqAccuracy: mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0,
        normalAvgScore: avgNormal,
        recentSessions: sessions.slice(0, 5),
        strengths: [...new Set(strengths)].slice(0, 3),
        weaknesses: [...new Set(weaknesses)].slice(0, 3),
      });
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-page flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-page">
      <PageHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{profile?.full_name || user?.email?.split("@")[0]}!</span>
          </h1>
          <p className="text-muted-foreground mt-2">Ready to practice your interview skills?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to="/interview">
            <AnimatedCard 
              variant="gradient" 
              hover="lift" 
              delay={50}
              className="cursor-pointer border-primary/20 hover:border-primary/40 group"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-2xl gradient-brand shadow-brand group-hover:shadow-brand-lg transition-all duration-300">
                  <Play className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Start New Interview</h3>
                  <p className="text-muted-foreground text-sm">Practice with AI-generated questions</p>
                </div>
              </CardContent>
            </AnimatedCard>
          </Link>
          <Link to="/history">
            <AnimatedCard variant="default" hover="lift" delay={100} className="cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-muted">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">View History</h3>
                  <p className="text-muted-foreground text-sm">Review past interview sessions</p>
                </div>
              </CardContent>
            </AnimatedCard>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Interviews"
            value={stats.totalInterviews}
            icon={Target}
            iconColor="text-primary"
            delay={150}
          />
          <StatCard
            title="Average Score"
            value={`${stats.averageScore.toFixed(1)}/10`}
            icon={Award}
            iconColor="text-warning"
            delay={200}
          />
          <StatCard
            title="MCQ Accuracy"
            value={`${stats.mcqAccuracy.toFixed(0)}%`}
            icon={Brain}
            iconColor="text-success"
            delay={250}
          />
          <StatCard
            title="Descriptive Avg"
            value={`${stats.normalAvgScore.toFixed(1)}/10`}
            icon={TrendingUp}
            iconColor="text-accent"
            delay={300}
          />
        </div>

        {/* Progress & Insights */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <AnimatedCard delay={350}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                Your Strengths
              </CardTitle>
              <CardDescription>Areas where you excel</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {stats.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-3 animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span className="text-sm text-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Complete more interviews to see your strengths</p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>

          {/* Areas for Improvement */}
          <AnimatedCard delay={400}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <AlertCircle className="w-4 h-4 text-warning" />
                </div>
                Areas for Improvement
              </CardTitle>
              <CardDescription>Focus on these to improve</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.weaknesses.length > 0 ? (
                <ul className="space-y-3">
                  {stats.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-3 animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0" />
                      <span className="text-sm text-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <Target className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Complete more interviews to see areas for improvement</p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Recent Sessions */}
        {stats.recentSessions.length > 0 && (
          <AnimatedCard delay={450}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent Sessions
              </CardTitle>
              <CardDescription>Your latest interview practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentSessions.map((session, index) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        session.question_mode === 'MCQ' 
                          ? 'bg-accent/10 text-accent' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {session.question_mode}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{session.job_role}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.difficulty} • {session.question_type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        Number(session.average_score) >= 7 ? 'text-success' :
                        Number(session.average_score) >= 5 ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {Number(session.average_score).toFixed(1)}/10
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Empty State CTA */}
        {stats.totalInterviews === 0 && (
          <AnimatedCard delay={350} className="text-center py-12">
            <Sparkles className="w-12 h-12 text-primary/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to ace your interviews?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start your first practice session and get AI-powered feedback to improve your skills.
            </p>
            <Link to="/interview">
              <GradientButton size="lg" icon={<Play className="w-5 h-5" />}>
                Start Your First Interview
              </GradientButton>
            </Link>
          </AnimatedCard>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, LogOut, Play, History, User, 
  TrendingUp, Target, Award, Brain, BarChart3
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
  const { user, loading: authLoading, signOut } = useAuth();
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

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (profileData) setProfile(profileData);

    // Fetch sessions
    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch questions for analysis
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

      // Analyze strengths and weaknesses from feedback
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <span className="font-semibold text-foreground">AI Interview Practice</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="ghost" size="sm">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name || user?.email?.split("@")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">Ready to practice your interview skills?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to="/interview">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/50 group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Start New Interview</h3>
                  <p className="text-muted-foreground text-sm">Practice with AI-generated questions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/history">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-muted">
                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">View History</h3>
                  <p className="text-muted-foreground text-sm">Review past interview sessions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalInterviews}</p>
                </div>
                <Target className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold text-foreground">{stats.averageScore.toFixed(1)}/10</p>
                </div>
                <Award className="w-8 h-8 text-amber-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MCQ Accuracy</p>
                  <p className="text-3xl font-bold text-foreground">{stats.mcqAccuracy.toFixed(0)}%</p>
                </div>
                <Brain className="w-8 h-8 text-emerald-500/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Descriptive Avg</p>
                  <p className="text-3xl font-bold text-foreground">{stats.normalAvgScore.toFixed(1)}/10</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress & Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Your Strengths
              </CardTitle>
              <CardDescription>Areas where you excel</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {stats.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                      <span className="text-sm text-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Complete more interviews to see your strengths</p>
              )}
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Areas for Improvement
              </CardTitle>
              <CardDescription>Focus on these to improve</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.weaknesses.length > 0 ? (
                <ul className="space-y-3">
                  {stats.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                      <span className="text-sm text-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Complete more interviews to see areas for improvement</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        {stats.recentSessions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
              <CardDescription>Your latest interview practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        session.question_mode === 'MCQ' 
                          ? 'bg-blue-500/10 text-blue-600' 
                          : 'bg-purple-500/10 text-purple-600'
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
                      <p className="font-semibold text-foreground">{Number(session.average_score).toFixed(1)}/10</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

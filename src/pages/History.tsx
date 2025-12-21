import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Award, Brain, FileText, Loader2, History as HistoryIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (data) setSessions(data);
    setLoading(false);
  };

  const mcqSessions = sessions.filter(s => s.question_mode === "MCQ");
  const normalSessions = sessions.filter(s => s.question_mode === "Normal");

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-page flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const SessionCard = ({ session, index }: { session: any; index: number }) => (
    <div 
      className="p-4 rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              session.question_mode === 'MCQ' 
                ? 'bg-accent/10 text-accent' 
                : 'bg-primary/10 text-primary'
            }`}>
              {session.question_mode}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              session.difficulty === 'Easy' ? 'bg-success/10 text-success' :
              session.difficulty === 'Medium' ? 'bg-warning/10 text-warning' :
              'bg-destructive/10 text-destructive'
            }`}>
              {session.difficulty}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{session.job_role}</h3>
          <p className="text-sm text-muted-foreground">{session.question_type}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(session.created_at).toLocaleDateString()}
          </div>
          <div className={`text-2xl font-bold ${
            Number(session.average_score) >= 7 ? 'text-success' :
            Number(session.average_score) >= 5 ? 'text-warning' :
            'text-destructive'
          }`}>
            {Number(session.average_score).toFixed(1)}/10
          </div>
          <p className="text-xs text-muted-foreground mt-1">{session.total_questions} questions</p>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <HistoryIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
      <Link to="/interview" className="text-primary hover:underline text-sm mt-2 inline-block">
        Start practicing now →
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen gradient-page">
      <PageHeader />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Link>

        <AnimatedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg gradient-brand-light">
                <Award className="w-5 h-5 text-primary" />
              </div>
              Interview History
            </CardTitle>
            <CardDescription>Review your past interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  All ({sessions.length})
                </TabsTrigger>
                <TabsTrigger value="mcq" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Brain className="w-3.5 h-3.5" />
                  MCQ ({mcqSessions.length})
                </TabsTrigger>
                <TabsTrigger value="normal" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  Normal ({normalSessions.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3">
                {sessions.length === 0 ? (
                  <EmptyState message="No interview sessions yet. Start practicing!" />
                ) : (
                  sessions.map((session, index) => <SessionCard key={session.id} session={session} index={index} />)
                )}
              </TabsContent>
              <TabsContent value="mcq" className="space-y-3">
                {mcqSessions.length === 0 ? (
                  <EmptyState message="No MCQ sessions yet." />
                ) : (
                  mcqSessions.map((session, index) => <SessionCard key={session.id} session={session} index={index} />)
                )}
              </TabsContent>
              <TabsContent value="normal" className="space-y-3">
                {normalSessions.length === 0 ? (
                  <EmptyState message="No descriptive sessions yet." />
                ) : (
                  normalSessions.map((session, index) => <SessionCard key={session.id} session={session} index={index} />)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </AnimatedCard>
      </main>
    </div>
  );
};

export default History;

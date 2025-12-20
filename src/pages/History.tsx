import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Award, Brain, FileText } from "lucide-react";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const SessionCard = ({ session }: { session: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                session.question_mode === 'MCQ' 
                  ? 'bg-blue-500/10 text-blue-600' 
                  : 'bg-purple-500/10 text-purple-600'
              }`}>
                {session.question_mode}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                session.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' :
                session.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                {session.difficulty}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{session.job_role}</h3>
            <p className="text-sm text-muted-foreground">{session.question_type}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
              <Calendar className="w-3 h-3" />
              {new Date(session.created_at).toLocaleDateString()}
            </div>
            <div className={`text-lg font-bold ${
              Number(session.average_score) >= 7 ? 'text-emerald-600' :
              Number(session.average_score) >= 5 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {Number(session.average_score).toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground">{session.total_questions} questions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Interview History
            </CardTitle>
            <CardDescription>Review your past interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({sessions.length})</TabsTrigger>
                <TabsTrigger value="mcq" className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  MCQ ({mcqSessions.length})
                </TabsTrigger>
                <TabsTrigger value="normal" className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Normal ({normalSessions.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4 space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No interview sessions yet. Start practicing!</p>
                ) : (
                  sessions.map(session => <SessionCard key={session.id} session={session} />)
                )}
              </TabsContent>
              <TabsContent value="mcq" className="mt-4 space-y-3">
                {mcqSessions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No MCQ sessions yet.</p>
                ) : (
                  mcqSessions.map(session => <SessionCard key={session.id} session={session} />)
                )}
              </TabsContent>
              <TabsContent value="normal" className="mt-4 space-y-3">
                {normalSessions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No descriptive sessions yet.</p>
                ) : (
                  normalSessions.map(session => <SessionCard key={session.id} session={session} />)
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;

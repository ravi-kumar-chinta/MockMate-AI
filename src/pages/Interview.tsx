import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Loader2, Play, Timer, 
  CheckCircle2, XCircle, Star, Send, Trophy
} from "lucide-react";

const JOB_ROLES = ["Software Developer", "AI/ML", "Embedded Systems"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES = ["Technical", "HR", "Behavioral"];
const QUESTION_MODES = ["Normal", "MCQ"];
const QUESTIONS_PER_SESSION = 5;

interface QuestionData {
  question: string;
  options?: string[];
  correctOption?: number;
}

interface FeedbackData {
  score: number;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
  explanation?: string;
}

const Interview = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Setup state
  const [step, setStep] = useState<"setup" | "interview" | "summary">("setup");
  const [config, setConfig] = useState({
    jobRole: "Software Developer",
    difficulty: "Medium",
    questionType: "Technical",
    questionMode: "Normal",
  });

  // Interview state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Timer state
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);

  // Session scores
  const [sessionScores, setSessionScores] = useState<number[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleSubmitAnswer();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startInterview = async () => {
    if (!user) return;
    setLoading(true);

    // Create session
    const { data: session, error } = await supabase
      .from("interview_sessions")
      .insert({
        user_id: user.id,
        job_role: config.jobRole,
        difficulty: config.difficulty,
        question_type: config.questionType,
        question_mode: config.questionMode,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to start interview", variant: "destructive" });
      setLoading(false);
      return;
    }

    setSessionId(session.id);
    setStep("interview");
    await fetchQuestion();
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setShowFeedback(false);
    setFeedback(null);
    setAnswer("");
    setSelectedOption(null);
    
    if (timerEnabled) {
      setTimeLeft(config.difficulty === "Easy" ? 180 : config.difficulty === "Medium" ? 120 : 90);
      setTimerActive(true);
    }

    try {
      const response = await supabase.functions.invoke("interview-ai", {
        body: {
          type: "question",
          role: config.jobRole,
          difficulty: config.difficulty,
          questionType: config.questionType,
          mode: config.questionMode,
        },
      });

      if (response.error) throw response.error;

      setQuestion(response.data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch question", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !sessionId || !question) return;
    setTimerActive(false);
    setLoading(true);

    const userAnswer = config.questionMode === "MCQ" 
      ? (selectedOption !== null ? question.options?.[selectedOption] : "")
      : answer;

    try {
      const response = await supabase.functions.invoke("interview-ai", {
        body: {
          type: "evaluate",
          role: config.jobRole,
          difficulty: config.difficulty,
          questionType: config.questionType,
          mode: config.questionMode,
          question: question.question,
          answer: userAnswer,
          options: question.options,
          selectedOption,
          correctOption: question.correctOption,
        },
      });

      if (response.error) throw response.error;

      const feedbackData = response.data;
      setFeedback(feedbackData);
      setSessionScores([...sessionScores, feedbackData.score]);

      // Save question to database
      await supabase.from("interview_questions").insert({
        session_id: sessionId,
        user_id: user.id,
        question_text: question.question,
        question_mode: config.questionMode,
        user_answer: userAnswer,
        mcq_options: question.options,
        selected_option: selectedOption,
        correct_option: question.correctOption,
        score: feedbackData.score,
        feedback: feedbackData,
        is_correct: config.questionMode === "MCQ" ? selectedOption === question.correctOption : feedbackData.score >= 7,
      });

      setShowFeedback(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to evaluate answer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex + 1 >= QUESTIONS_PER_SESSION) {
      await endSession();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      await fetchQuestion();
    }
  };

  const endSession = async () => {
    if (!sessionId || !user) return;
    
    const avgScore = sessionScores.length > 0 
      ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length 
      : 0;

    await supabase
      .from("interview_sessions")
      .update({
        completed: true,
        total_questions: sessionScores.length,
        total_score: sessionScores.reduce((a, b) => a + b, 0),
        average_score: avgScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    setStep("summary");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Setup Screen
  if (step === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-xl">
          <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Configure Interview
              </CardTitle>
              <CardDescription>Set up your practice session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Role</Label>
                <Select value={config.jobRole} onValueChange={(v) => setConfig({ ...config, jobRole: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={config.difficulty} onValueChange={(v) => setConfig({ ...config, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select value={config.questionType} onValueChange={(v) => setConfig({ ...config, questionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question Mode</Label>
                <Select value={config.questionMode} onValueChange={(v) => setConfig({ ...config, questionMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_MODES.map((m) => <SelectItem key={m} value={m}>{m === "Normal" ? "Descriptive" : m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Enable Timer</span>
                </div>
                <Button
                  variant={timerEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimerEnabled(!timerEnabled)}
                >
                  {timerEnabled ? "On" : "Off"}
                </Button>
              </div>

              <Button onClick={startInterview} disabled={loading} className="w-full" size="lg">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Start Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Summary Screen
  if (step === "summary") {
    const avgScore = sessionScores.length > 0 
      ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length 
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="container mx-auto max-w-xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Interview Complete!</CardTitle>
              <CardDescription>Here's your performance summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{sessionScores.length}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className={`text-3xl font-bold ${
                    avgScore >= 7 ? 'text-emerald-600' :
                    avgScore >= 5 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{avgScore.toFixed(1)}/10</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Score Distribution</Label>
                <div className="flex gap-1">
                  {sessionScores.map((score, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-medium text-white ${
                        score >= 7 ? 'bg-emerald-500' :
                        score >= 5 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                    >
                      {score}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <Button className="flex-1" onClick={() => {
                  setStep("setup");
                  setSessionScores([]);
                  setCurrentQuestionIndex(0);
                  setSessionId(null);
                }}>
                  New Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Interview Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {QUESTIONS_PER_SESSION}
            </span>
            {timerEnabled && timerActive && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                timeLeft < 30 ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'
              }`}>
                <Timer className="w-4 h-4" />
                <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          <Progress value={((currentQuestionIndex + 1) / QUESTIONS_PER_SESSION) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                {config.jobRole}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                config.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' :
                config.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                {config.difficulty}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                {config.questionType}
              </span>
            </div>
            <CardTitle className="text-lg">{loading ? "Loading question..." : question?.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : config.questionMode === "MCQ" && question?.options ? (
              <RadioGroup
                value={selectedOption?.toString()}
                onValueChange={(v) => setSelectedOption(parseInt(v))}
                disabled={showFeedback}
                className="space-y-3"
              >
                {question.options.map((option, i) => (
                  <div key={i} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    showFeedback
                      ? i === question.correctOption
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : selectedOption === i
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-border'
                      : selectedOption === i
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value={i.toString()} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {showFeedback && i === question.correctOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {showFeedback && selectedOption === i && i !== question.correctOption && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[150px]"
                disabled={showFeedback}
              />
            )}

            {!showFeedback && (
              <Button
                onClick={handleSubmitAnswer}
                disabled={loading || (config.questionMode === "MCQ" ? selectedOption === null : !answer.trim())}
                className="w-full mt-4"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Answer
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Feedback Card */}
        {showFeedback && feedback && (
          <Card className="mb-4 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Feedback</CardTitle>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(feedback.score / 2)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold text-foreground">{feedback.score}/10</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className={`font-medium ${
                    feedback.score >= 7 ? 'text-emerald-600' :
                    feedback.score >= 5 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>{feedback.score}/10</span>
                </div>
                <Progress value={feedback.score * 10} className="h-2" />
              </div>

              {config.questionMode === "MCQ" && feedback.explanation && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-700 mb-1">Explanation</p>
                  <p className="text-sm text-foreground">{feedback.explanation}</p>
                </div>
              )}

              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    What you did well
                  </p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-700 mb-2">Areas for improvement</p>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.sampleAnswer && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Sample Answer</p>
                  <p className="text-sm text-foreground">{feedback.sampleAnswer}</p>
                </div>
              )}

              <Button onClick={handleNextQuestion} className="w-full">
                {currentQuestionIndex + 1 >= QUESTIONS_PER_SESSION ? (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Finish Interview
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Next Question
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Interview;

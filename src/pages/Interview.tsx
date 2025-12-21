import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Loader2, Play, Timer, 
  CheckCircle2, XCircle, Star, Send, Trophy, Sparkles
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatedProgress } from "@/components/ui/AnimatedProgress";
import { GradientButton } from "@/components/ui/GradientButton";
import { Logo } from "@/components/ui/Logo";

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
      <div className="min-h-screen gradient-page flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Setup Screen
  if (step === "setup") {
    return (
      <div className="min-h-screen gradient-page">
        <PageHeader />
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>

          <AnimatedCard>
            <CardHeader className="text-center">
              <div className="mx-auto p-3 rounded-2xl gradient-brand shadow-brand w-fit mb-4">
                <Play className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Configure Interview</CardTitle>
              <CardDescription>Set up your practice session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Job Role</Label>
                <Select value={config.jobRole} onValueChange={(v) => setConfig({ ...config, jobRole: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Difficulty</Label>
                <Select value={config.difficulty} onValueChange={(v) => setConfig({ ...config, difficulty: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Question Type</Label>
                <Select value={config.questionType} onValueChange={(v) => setConfig({ ...config, questionType: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Question Mode</Label>
                <Select value={config.questionMode} onValueChange={(v) => setConfig({ ...config, questionMode: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_MODES.map((m) => <SelectItem key={m} value={m}>{m === "Normal" ? "Descriptive" : m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Enable Timer</span>
                    <p className="text-xs text-muted-foreground">Simulate real interview pressure</p>
                  </div>
                </div>
                <Button
                  variant={timerEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={timerEnabled ? "gradient-brand text-primary-foreground" : ""}
                >
                  {timerEnabled ? "On" : "Off"}
                </Button>
              </div>

              <GradientButton 
                onClick={startInterview} 
                loading={loading} 
                className="w-full" 
                size="lg"
                icon={<Play className="w-5 h-5" />}
              >
                Start Interview
              </GradientButton>
            </CardContent>
          </AnimatedCard>
        </main>
      </div>
    );
  }

  // Summary Screen
  if (step === "summary") {
    const avgScore = sessionScores.length > 0 
      ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length 
      : 0;

    return (
      <div className="min-h-screen gradient-page">
        <PageHeader showNav={false} />
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <AnimatedCard className="overflow-hidden">
            {/* Celebration header */}
            <div className="gradient-brand p-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4 animate-float">
                <Trophy className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-primary-foreground mb-1">Interview Complete!</h2>
              <p className="text-primary-foreground/80">Great job on finishing your practice session</p>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-foreground">{sessionScores.length}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className={`text-3xl font-bold ${
                    avgScore >= 7 ? 'text-success' :
                    avgScore >= 5 ? 'text-warning' :
                    'text-destructive'
                  }`}>{avgScore.toFixed(1)}/10</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Score Distribution</Label>
                <div className="flex gap-2">
                  {sessionScores.map((score, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-12 rounded-lg flex items-center justify-center text-sm font-bold text-primary-foreground transition-all hover:scale-105 ${
                        score >= 7 ? 'bg-success' :
                        score >= 5 ? 'bg-warning' :
                        'bg-destructive'
                      }`}
                    >
                      {score}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <GradientButton className="flex-1" onClick={() => {
                  setStep("setup");
                  setSessionScores([]);
                  setCurrentQuestionIndex(0);
                  setSessionId(null);
                }}>
                  New Interview
                </GradientButton>
              </div>
            </CardContent>
          </AnimatedCard>
        </main>
      </div>
    );
  }

  // Interview Screen
  return (
    <div className="min-h-screen gradient-page">
      <PageHeader showNav={false} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              Question <span className="font-semibold text-foreground">{currentQuestionIndex + 1}</span> of {QUESTIONS_PER_SESSION}
            </span>
            {timerEnabled && timerActive && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-medium ${
                timeLeft < 30 ? 'bg-destructive/10 text-destructive animate-pulse-soft' : 'bg-muted text-muted-foreground'
              }`}>
                <Timer className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <AnimatedProgress value={((currentQuestionIndex + 1) / QUESTIONS_PER_SESSION) * 100} variant="brand" animated />
        </div>

        {/* Question Card */}
        <AnimatedCard className="mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                {config.jobRole}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                config.difficulty === 'Easy' ? 'bg-success/10 text-success' :
                config.difficulty === 'Medium' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                {config.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground">
                {config.questionType}
              </span>
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {loading && !question ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating question...
                </div>
              ) : question?.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !question ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full gradient-brand animate-pulse" />
                  <Sparkles className="w-6 h-6 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">AI is crafting your question...</p>
              </div>
            ) : config.questionMode === "MCQ" && question?.options ? (
              <RadioGroup
                value={selectedOption?.toString()}
                onValueChange={(v) => setSelectedOption(parseInt(v))}
                disabled={showFeedback}
                className="space-y-3"
              >
                {question.options.map((option, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                      showFeedback
                        ? i === question.correctOption
                          ? 'border-success bg-success/10'
                          : selectedOption === i
                            ? 'border-destructive bg-destructive/10'
                            : 'border-border'
                        : selectedOption === i
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={i.toString()} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer text-sm">
                      {option}
                    </Label>
                    {showFeedback && i === question.correctOption && (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    {showFeedback && selectedOption === i && i !== question.correctOption && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[180px] resize-none text-base"
                disabled={showFeedback}
              />
            )}

            {!showFeedback && question && (
              <GradientButton
                onClick={handleSubmitAnswer}
                disabled={loading || (config.questionMode === "MCQ" ? selectedOption === null : !answer.trim())}
                className="w-full mt-4"
                size="lg"
                loading={loading}
                icon={<Send className="w-4 h-4" />}
              >
                Submit Answer
              </GradientButton>
            )}
          </CardContent>
        </AnimatedCard>

        {/* Feedback Card */}
        {showFeedback && feedback && (
          <AnimatedCard className="border-primary/20 animate-slide-up">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Feedback</CardTitle>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 transition-all ${
                        i < Math.round(feedback.score / 2)
                          ? 'text-warning fill-warning'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold text-foreground text-lg">{feedback.score}/10</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className={`font-semibold ${
                    feedback.score >= 7 ? 'text-success' :
                    feedback.score >= 5 ? 'text-warning' :
                    'text-destructive'
                  }`}>{feedback.score}/10</span>
                </div>
                <AnimatedProgress value={feedback.score * 10} animated />
              </div>

              {config.questionMode === "MCQ" && feedback.explanation && (
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-sm font-semibold text-accent mb-1">Explanation</p>
                  <p className="text-sm text-foreground">{feedback.explanation}</p>
                </div>
              )}

              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    What you did well
                  </p>
                  <ul className="space-y-1.5">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-success mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <p className="text-sm font-semibold text-warning mb-2">Areas for improvement</p>
                  <ul className="space-y-1.5">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-warning mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.sampleAnswer && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Sample Answer</p>
                  <p className="text-sm text-foreground leading-relaxed">{feedback.sampleAnswer}</p>
                </div>
              )}

              <GradientButton onClick={handleNextQuestion} className="w-full" size="lg" loading={loading}>
                {currentQuestionIndex + 1 >= QUESTIONS_PER_SESSION ? (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Finish Interview
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </GradientButton>
            </CardContent>
          </AnimatedCard>
        )}
      </main>
    </div>
  );
};

export default Interview;

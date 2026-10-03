import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Play, Send, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, type InterviewSession } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  expectedPoints: string[];
  timeLimit: string;
}

interface Answer {
  questionId: number;
  answer: string;
  evaluation?: {
    score: number;
    strengths: string[];
    improvements: string[];
    feedback: string;
  };
}

const AIInterview = () => {
  const { profile, saveProfile } = useAuth();
  const activeSession = profile.interviews?.find((session) => !session.completed && session.questions.length > 0);
  const [step, setStep] = useState<"select" | "setup" | "interview">(activeSession ? "interview" : "select");
  const [interviewType, setInterviewType] = useState<"hr" | "technical" | null>(activeSession?.type || null);
  const [jobRole, setJobRole] = useState(activeSession?.role || "");
  const [focusArea, setFocusArea] = useState(activeSession?.focusArea || "");
  const [questions, setQuestions] = useState<Question[]>(activeSession?.questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(activeSession?.answers.length || 0);
  const [answers, setAnswers] = useState<Answer[]>(activeSession?.answers || []);
  const [sessionId, setSessionId] = useState(activeSession?.id || "");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { toast } = useToast();

  const selectInterviewType = (type: "hr" | "technical") => {
    setInterviewType(type);
    setStep("setup");
  };

  const generateQuestions = async () => {
    if (!jobRole.trim()) {
      toast({
        title: "Job Role Required",
        description: "Please enter the job role you're preparing for",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRequest<{ questions: Question[] }>("/ai/generate-interview-questions", {
        method: "POST",
        body: JSON.stringify({ role: jobRole, focus: focusArea || interviewType }),
      });

      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }

      setQuestions(data.questions);
      const newSessionId = crypto.randomUUID();
      const newSession: InterviewSession = {
        id: newSessionId,
        type: interviewType || "technical",
        role: jobRole,
        focusArea: focusArea || interviewType || "",
        date: new Date().toISOString(),
        score: 0,
        answers: [],
        questions: data.questions,
        completed: false,
      };
      setSessionId(newSessionId);
      await saveProfile({ interviews: [...(profile.interviews || []), newSession] });
      setStep("interview");
      toast({
        title: "✨ Interview Started",
        description: `${data.questions.length} questions generated for ${jobRole}`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate interview questions. Please try again.';
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please type your answer before submitting",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    setIsEvaluating(true);

    try {
      const data = await apiRequest<NonNullable<Answer["evaluation"]>>("/ai/evaluate-answer", {
        method: "POST",
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: currentAnswer,
          expectedPoints: currentQuestion.expectedPoints,
        }),
      });

      if (!data || typeof data.score !== 'number') {
        throw new Error('Invalid evaluation response. Please try again.');
      }

      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        evaluation: data
      };

      const nextAnswers = [...answers, newAnswer];
      const completed = nextAnswers.length === questions.length;
      const updatedSession: InterviewSession = {
        id: sessionId,
        type: interviewType || "technical",
        role: jobRole,
        focusArea,
        date: profile.interviews?.find((session) => session.id === sessionId)?.date || new Date().toISOString(),
        score: completed
          ? Math.round(nextAnswers.reduce((sum, item) => sum + (item.evaluation?.score || 0), 0) / nextAnswers.length)
          : 0,
        answers: nextAnswers,
        questions,
        completed,
      };
      const previousSessions = (profile.interviews || []).filter((session) => session.id !== sessionId);
      await saveProfile({ interviews: [...previousSessions, updatedSession] });
      setAnswers(nextAnswers);
      setCurrentAnswer("");

      const scoreEmoji = data.score >= 80 ? '🎉' : data.score >= 60 ? '👍' : '💪';
      toast({
        title: `${scoreEmoji} Answer Evaluated`,
        description: `Score: ${data.score}/100`,
      });

      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const endInterview = () => {
    setStep("select");
    setInterviewType(null);
    setJobRole("");
    setFocusArea("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAnswer("");
    setSessionId("");
  };

  const previousInterviews = profile.interviews || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">AI Interview Prep</h2>
        <p className="text-muted-foreground">Practice interviews with AI and get instant feedback</p>
      </div>

      {step === "select" ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* HR Interview */}
          <Card className="shadow-card hover:shadow-elevated transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <span>HR Interview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Practice behavioral questions, company culture fit, and soft skills assessment.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Topics Covered:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Behavioral Questions</Badge>
                  <Badge variant="secondary">Team Collaboration</Badge>
                  <Badge variant="secondary">Problem Solving</Badge>
                  <Badge variant="secondary">Career Goals</Badge>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-hero hover:opacity-90 shadow-glow"
                onClick={() => selectInterviewType("hr")}
              >
                <Play className="mr-2 h-4 w-4" />
                Start HR Interview
              </Button>
            </CardContent>
          </Card>

          {/* Technical Interview */}
          <Card className="shadow-card hover:shadow-elevated transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-accent" />
                <span>Technical Interview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Practice coding questions, system design, and technical problem-solving.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Topics Covered:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Data Structures</Badge>
                  <Badge variant="secondary">Algorithms</Badge>
                  <Badge variant="secondary">System Design</Badge>
                  <Badge variant="secondary">Code Review</Badge>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-hero hover:opacity-90 shadow-glow"
                onClick={() => selectInterviewType("technical")}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Technical Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : step === "setup" ? (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Interview Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="jobRole">Job Role *</Label>
              <Input
                id="jobRole"
                placeholder="e.g., Software Developer, Data Scientist, DevOps Engineer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the role you're preparing for to get relevant questions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="focusArea">Focus Area (Optional)</Label>
              <Input
                id="focusArea"
                placeholder="e.g., DSA, System Design, React, Python, ML"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Specify a particular area to focus on during the interview
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-hero hover:opacity-90 shadow-glow"
                onClick={generateQuestions}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{jobRole} - {interviewType === "hr" ? "HR" : "Technical"} Interview</span>
              <Button variant="outline" onClick={endInterview}>
                End Interview
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <Badge variant="secondary">
                {answers.length} answered
              </Badge>
            </div>

            {/* Current Question */}
            <div className="bg-gradient-card border border-border rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center flex-shrink-0 shadow-glow">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">AI Interviewer</h4>
                    <Badge variant="outline">{questions[currentQuestionIndex]?.category}</Badge>
                    <Badge variant="secondary">{questions[currentQuestionIndex]?.difficulty}</Badge>
                  </div>
                  <p className="text-foreground mb-3">
                    {questions[currentQuestionIndex]?.question}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Time Limit: {questions[currentQuestionIndex]?.timeLimit}
                  </p>
                </div>
              </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                placeholder="Type your detailed answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-gradient-hero hover:opacity-90 shadow-glow"
              onClick={submitAnswer}
              disabled={isEvaluating || !currentAnswer.trim()}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating Answer...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Answer
                </>
              )}
            </Button>

            {/* Previous Answer Feedback */}
            {answers.length > 0 && answers[currentQuestionIndex - 1] && (
              <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  Previous Answer Feedback
                  <Badge variant={answers[currentQuestionIndex - 1].evaluation!.score >= 70 ? "default" : "destructive"}>
                    {answers[currentQuestionIndex - 1].evaluation!.score}/100
                  </Badge>
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Strengths
                    </h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {answers[currentQuestionIndex - 1].evaluation!.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-orange-500" />
                      Areas for Improvement
                    </h5>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {answers[currentQuestionIndex - 1].evaluation!.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold mb-2">Detailed Feedback</h5>
                    <p className="text-sm text-muted-foreground">
                      {answers[currentQuestionIndex - 1].evaluation!.feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Interview Complete */}
            {currentQuestionIndex === questions.length - 1 && answers.length === questions.length && (
              <div className="bg-gradient-card border border-border rounded-lg p-6 text-center">
                <h4 className="font-semibold text-xl mb-2">Interview Complete! 🎉</h4>
                <p className="text-muted-foreground mb-4">
                  You've answered all {questions.length} questions.
                </p>
                <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                  Average Score: {Math.round(answers.reduce((sum, a) => sum + (a.evaluation?.score || 0), 0) / answers.length)}%
                </div>
                <Button onClick={endInterview} className="bg-gradient-hero hover:opacity-90">
                  Start New Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Interviews */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Previous Interview Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {previousInterviews.length ? previousInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 bg-gradient-card border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-semibold">{interview.type === "hr" ? "HR" : "Technical"} Interview</h4>
                    <Badge variant="outline">{interview.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(interview.date).toLocaleDateString()} {interview.completed ? "" : "· In progress"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                    {interview.completed ? `${interview.score}%` : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">{interview.completed ? "Score" : "Pending"}</p>
                </div>
              </div>
            )) : <p className="py-4 text-sm text-muted-foreground">Completed interview sessions will appear here.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInterview;

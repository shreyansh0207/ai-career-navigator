import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { ArrowRight, BarChart3, BriefcaseIcon, Map, MessageSquare, Users, Zap, Calendar, Target, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RoadmapPhase {
  phase: string;
  duration: string;
  topics: string[];
  resources?: string[];
}

interface RoadmapData {
  roadmap?: { phases?: RoadmapPhase[]; milestones?: string[] };
  dailySchedule?: {
    schedule?: Array<{ activity: string; time: string; description: string; duration: string }>;
    weeklyGoals?: string[];
  };
  recommendations?: string[];
  rawContent?: string;
}

const Home = () => {
  const { toast } = useToast();
  const { user, profile, saveProfile } = useAuth();
  const navigate = useNavigate();
  const [domain, setDomain] = useState(profile.roadmapRequest?.domain || "");
  const [learningGoal, setLearningGoal] = useState(profile.roadmapRequest?.learningGoal || "");
  const [availableHours, setAvailableHours] = useState(profile.roadmapRequest?.availableHours || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>((profile.roadmapData as RoadmapData | null) || null);

  const handleGenerateRoadmap = async () => {
    if (!domain.trim() || !learningGoal.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in domain and learning goal",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiRequest<{ success: boolean; data: RoadmapData }>("/ai/generate-roadmap", {
        method: "POST",
        body: JSON.stringify({
          domain: domain.trim(),
          learningGoal: learningGoal.trim(),
          availableHours: availableHours.trim(),
        }),
      });

      if (result?.success) {
        setRoadmapData(result.data);
        await saveProfile({
          roadmapData: result.data,
          roadmapRequest: { domain: domain.trim(), learningGoal: learningGoal.trim(), availableHours: availableHours.trim() },
        });
        toast({
          title: "Roadmap Generated!",
          description: "Your personalized learning roadmap is ready",
        });
      } else {
        throw new Error("Failed to generate roadmap");
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const features = [
    {
      icon: Map,
      title: "AI Career Mapping",
      description: "Discover career paths in any field and get AI-powered guidance to navigate your journey from beginner to professional.",
    },
    {
      icon: BarChart3,
      title: "Skill Gap Analysis",
      description: "Identify missing skills and get a personalized learning roadmap with curated resources.",
    },
    {
      icon: MessageSquare,
      title: "AI Interview Prep",
      description: "Practice with our AI interviewer for HR and technical interviews with instant feedback.",
    },
    {
      icon: BriefcaseIcon,
      title: "Smart Job Matching",
      description: "Match your profile with the best-fit jobs and opportunities tailored to your skills.",
    },
    {
      icon: Users,
      title: "Mentor Connect",
      description: "Connect with mentors, communities, and open-source projects to accelerate your growth.",
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Get real-time career insights powered by advanced AI models for data-driven decisions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <div className="bg-gradient-hero bg-clip-text text-transparent text-6xl md:text-7xl font-bold leading-tight animate-float">
                Start Your Journey to Dream Career
              </div>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Let AI Guide You From Day One
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered career companion. From choosing your field to landing your dream job - get personalized learning roadmaps, skill development, interview prep, and career guidance all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                      <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow text-lg px-8" asChild>
                        <Link to={user ? "/dashboard" : "/auth"}>
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link to="/dashboard/career-mapping">Try Career Mapping</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Powerful Features for Your Career Growth
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to navigate your career journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4 shadow-glow">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Generator Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Get Your Personalized Learning Roadmap
            </h2>
            <p className="text-xl text-muted-foreground">
              AI-powered roadmap and daily timetable tailored to your goals
            </p>
          </div>

          <Card className="shadow-elevated">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="domain" className="text-base font-semibold">
                    Domain / Field
                  </Label>
                  <Input
                    id="domain"
                    placeholder="e.g., MERN Stack, Android Development, MLOps"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="learningGoal" className="text-base font-semibold">
                    Learning Goal
                  </Label>
                  <Textarea
                    id="learningGoal"
                    placeholder="Describe what you want to achieve (e.g., Become job-ready in MERN stack in 6 months)"
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="availableHours" className="text-base font-semibold">
                    Available Hours per Day (Optional)
                  </Label>
                  <Input
                    id="availableHours"
                    type="number"
                    placeholder="e.g., 4"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleGenerateRoadmap}
                  disabled={isGenerating}
                  className="w-full bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow"
                  size="lg"
                >
                  {isGenerating ? "Generating..." : "Generate My Roadmap"}
                  <Target className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {roadmapData && (
                <div className="mt-8 space-y-6">
                  {/* Roadmap Phases */}
                  {roadmapData.roadmap?.phases && (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Map className="h-6 w-6 text-primary" />
                        Learning Roadmap
                      </h3>
                      {roadmapData.roadmap.phases.map((phase: any, index: number) => (
                        <Card key={index} className="bg-secondary/50">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-lg mb-2">
                              {phase.phase} ({phase.duration})
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Topics:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  {phase.topics?.map((topic: string, i: number) => (
                                    <li key={i}>{topic}</li>
                                  ))}
                                </ul>
                              </div>
                              {phase.resources && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground mb-1">Resources:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm">
                                    {phase.resources.map((resource: string, i: number) => (
                                      <li key={i}>{resource}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Daily Schedule */}
                  {roadmapData.dailySchedule?.schedule && (
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-primary" />
                        Daily Timetable
                      </h3>
                      <div className="space-y-2">
                        {roadmapData.dailySchedule.schedule.map((slot: any, index: number) => (
                          <Card key={index} className="bg-accent/10">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold">{slot.activity}</h4>
                                    <span className="text-sm text-muted-foreground">{slot.time}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{slot.description}</p>
                                  <p className="text-xs text-accent mt-1">Duration: {slot.duration}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones & Weekly Goals */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {roadmapData.roadmap?.milestones && (
                      <Card className="bg-primary/5">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">🎯 Milestones</h4>
                          <ul className="space-y-2 text-sm">
                            {roadmapData.roadmap.milestones.map((milestone: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{milestone}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {roadmapData.dailySchedule?.weeklyGoals && (
                      <Card className="bg-accent/5">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">📅 Weekly Goals</h4>
                          <ul className="space-y-2 text-sm">
                            {roadmapData.dailySchedule.weeklyGoals.map((goal: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-accent">•</span>
                                <span>{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Recommendations */}
                  {roadmapData.recommendations && (
                    <Card className="bg-gradient-card border-none">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3">💡 Recommendations</h4>
                        <ul className="space-y-2 text-sm">
                          {roadmapData.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Raw content fallback */}
                  {roadmapData.rawContent && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <pre className="text-sm whitespace-pre-wrap">{roadmapData.rawContent}</pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-card border-none shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Career?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who are using AI to accelerate their career growth. Start your journey today.
              </p>
              <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow text-lg px-8" asChild>
                <Link to={user ? "/dashboard" : "/auth"}>
                  Start Your Free Career Analysis <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2025 AI Career Navigator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, BriefcaseIcon, Map, MessageSquare, Users, Upload, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const DashboardHome = () => {
  const { user, profile } = useAuth();
  const skills = profile.skillLevels?.[profile.selectedRole || ""] || [];
  const skillReadiness = skills.length
    ? Math.round((skills.reduce((sum, skill) => sum + skill.current, 0) / skills.reduce((sum, skill) => sum + skill.target, 0)) * 100)
    : 0;
  const interviews = profile.interviews || [];
  const completedInterviews = interviews.filter((interview) => interview.completed);
  const averageInterviewScore = completedInterviews.length
    ? Math.round(completedInterviews.reduce((sum, interview) => sum + interview.score, 0) / completedInterviews.length)
    : 0;
  const profileCompletion = Math.round((
    25 + Number(Boolean(profile.resumeText)) * 25 + Number(Boolean(profile.careerAnalysis)) * 25 + Number(skills.length > 0) * 25
  ));

  const quickActions = [
    {
      icon: Upload,
      title: "Upload Resume",
      description: "Start with career mapping",
      link: "/dashboard/career-mapping",
    },
    {
      icon: BarChart3,
      title: "View Skill Roadmap",
      description: "Check your learning path",
      link: "/dashboard/skill-roadmap",
    },
    {
      icon: MessageSquare,
      title: "Practice Interview",
      description: "AI interview simulation",
      link: "/dashboard/ai-interview",
    },
    {
      icon: BriefcaseIcon,
      title: "Find Jobs",
      description: "Smart job matching",
      link: "/dashboard/job-matching",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.displayName}</h2>
        <p className="text-muted-foreground">Let's continue building your career path</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link to={action.link} key={index}>
              <Card className="bg-gradient-card border-border shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4 shadow-glow">
                    <action.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h4 className="font-semibold mb-1">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Career Progress */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Your Career Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Completion</span>
              <span className="font-semibold">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-gradient-hero h-2 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Skills Assessed</span>
              <span className="font-semibold">{skillReadiness}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-gradient-hero h-2 rounded-full" style={{ width: `${skillReadiness}%` }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Interview Practice</span>
              <span className="font-semibold">{averageInterviewScore}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-gradient-hero h-2 rounded-full" style={{ width: `${averageInterviewScore}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center flex-shrink-0 shadow-glow">
              <span className="text-primary-foreground font-semibold text-sm">1</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Complete Career Mapping</h4>
              <p className="text-sm text-muted-foreground mb-2">Upload your resume to get personalized career insights</p>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dashboard/career-mapping">
                  Start Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center flex-shrink-0 shadow-glow">
              <span className="text-primary-foreground font-semibold text-sm">2</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Review Your Skill Roadmap</h4>
              <p className="text-sm text-muted-foreground mb-2">Identify skill gaps and create your learning path</p>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dashboard/skill-roadmap">
                  View Roadmap <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;

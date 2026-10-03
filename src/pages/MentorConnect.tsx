import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Star, Users, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MentorConnect = () => {
  const { profile, saveProfile } = useAuth();
  const { toast } = useToast();
  const mentors = [
    {
      name: "Sarah Chen",
      role: "Senior Data Scientist",
      company: "Google",
      expertise: ["Machine Learning", "Python", "Career Growth"],
      rating: 4.9,
      sessions: 127,
      initials: "SC",
    },
    {
      name: "Michael Rodriguez",
      role: "Engineering Manager",
      company: "Meta",
      expertise: ["System Design", "Leadership", "Tech Career"],
      rating: 4.8,
      sessions: 94,
      initials: "MR",
    },
    {
      name: "Emily Watson",
      role: "Product Manager",
      company: "Amazon",
      expertise: ["Product Strategy", "User Research", "Agile"],
      rating: 4.7,
      sessions: 82,
      initials: "EW",
    },
  ];

  const gfi = (q: string) =>
    `https://github.com/search?q=${encodeURIComponent(q + ' label:"good first issue" state:open')}&type=issues`;

  const communities = [
    { name: "freeCodeCamp Forum", members: "Global", topics: ["Web Dev", "JavaScript", "Beginners"], activity: "Very Active", link: "https://forum.freecodecamp.org/" },
    { name: "100xDevs Community", members: "India", topics: ["MERN", "Web3", "DevOps"], activity: "Very Active", link: "https://100xdevs.com/" },
    { name: "Reactiflux (Discord)", members: "200k+", topics: ["React", "Frontend"], activity: "Very Active", link: "https://www.reactiflux.com/" },
    { name: "Kaggle Community", members: "20M+", topics: ["Data Science", "ML", "Competitions"], activity: "Very Active", link: "https://www.kaggle.com/discussions" },
    { name: "Hugging Face Discord", members: "100k+", topics: ["AI/ML", "LLMs", "NLP"], activity: "Very Active", link: "https://huggingface.co/join/discord" },
    { name: "MLOps Community", members: "25k+", topics: ["MLOps", "Deployment"], activity: "Active", link: "https://mlops.community/" },
    { name: "Kubernetes Slack", members: "190k+", topics: ["DevOps", "Cloud", "K8s"], activity: "Very Active", link: "https://slack.k8s.io/" },
    { name: "Android Developers Community", members: "Global", topics: ["Android", "Kotlin"], activity: "Active", link: "https://developer.android.com/community" },
    { name: "TryHackMe Discord", members: "Global", topics: ["Cybersecurity", "CTF"], activity: "Very Active", link: "https://discord.gg/tryhackme" },
    { name: "Dev.to", members: "1M+", topics: ["All Tech", "Blogs"], activity: "Very Active", link: "https://dev.to/" },
    { name: "r/cscareerquestions", members: "1M+", topics: ["Careers", "Interviews"], activity: "Very Active", link: "https://www.reddit.com/r/cscareerquestions/" },
    { name: "GDG (Google Developer Groups)", members: "Local chapters", topics: ["Meetups", "Google Tech"], activity: "Active", link: "https://gdg.community.dev/" },
  ];

  const projects = [
    { name: "React / Frontend", tech: ["React", "TypeScript"], contributors: "Good first issues", difficulty: "Beginner", link: gfi("language:TypeScript react") },
    { name: "MERN / Node.js Backend", tech: ["Node.js", "Express", "MongoDB"], contributors: "Good first issues", difficulty: "Beginner", link: gfi("language:JavaScript node") },
    { name: "Python / Django Backend", tech: ["Python", "Django"], contributors: "Good first issues", difficulty: "Beginner", link: gfi("language:Python django") },
    { name: "Machine Learning", tech: ["Python", "scikit-learn", "PyTorch"], contributors: "Good first issues", difficulty: "Intermediate", link: gfi("language:Python machine-learning") },
    { name: "MLOps", tech: ["MLflow", "Kubeflow"], contributors: "Good first issues", difficulty: "Intermediate", link: gfi("mlops") },
    { name: "DevOps / Kubernetes", tech: ["Go", "Docker", "K8s"], contributors: "Good first issues", difficulty: "Intermediate", link: gfi("language:Go kubernetes") },
    { name: "Android", tech: ["Kotlin", "Jetpack"], contributors: "Good first issues", difficulty: "Beginner", link: gfi("language:Kotlin android") },
    { name: "Blockchain / Web3", tech: ["Solidity", "Rust"], contributors: "Good first issues", difficulty: "Advanced", link: gfi("blockchain") },
    { name: "Cybersecurity", tech: ["Python", "Security"], contributors: "Good first issues", difficulty: "Intermediate", link: gfi("security") },
    { name: "Browse all beginner issues", tech: ["Any"], contributors: "goodfirstissue.dev", difficulty: "Beginner", link: "https://goodfirstissue.dev/" },
  ];

  const requestSession = async (mentorName: string) => {
    if (profile.mentorRequests?.includes(mentorName)) return;
    try {
      await saveProfile({ mentorRequests: [...(profile.mentorRequests || []), mentorName] });
      toast({ title: "Request saved", description: `Your request to connect with ${mentorName} is in your profile.` });
    } catch (error) {
      toast({
        title: "Request not saved",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mentor Connect</h2>
        <p className="text-muted-foreground">Connect with mentors and join communities to accelerate your growth</p>
      </div>

      {/* Top Mentors */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Recommended Mentors</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar className="w-16 h-16 bg-gradient-hero text-primary-foreground shadow-glow">
                    <AvatarFallback className="bg-gradient-hero text-primary-foreground text-lg font-bold">
                      {mentor.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{mentor.name}</h4>
                    <p className="text-sm text-muted-foreground">{mentor.role}</p>
                    <p className="text-sm text-muted-foreground">{mentor.company}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold">{mentor.rating}</span>
                    </div>
                    <span className="text-muted-foreground">{mentor.sessions} sessions</span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Expertise:</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertise.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-hero hover:opacity-90 shadow-glow"
                    size="sm"
                    onClick={() => void requestSession(mentor.name)}
                    disabled={profile.mentorRequests?.includes(mentor.name)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {profile.mentorRequests?.includes(mentor.name) ? "Request Saved" : "Request Session"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Communities */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Join Communities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {communities.map((community, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-card border border-border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{community.name}</h4>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                    <span>{community.members} members</span>
                    <Badge variant="outline" className="text-xs">
                      {community.activity}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {community.topics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" asChild><a href={community.link} target="_blank" rel="noopener noreferrer">Join</a></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Source Projects */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Github className="h-6 w-6 text-primary" />
            <span>Open Source Projects</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-card border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{project.name}</h4>
                    <Badge variant={
                      project.difficulty === "Beginner" ? "secondary" :
                      project.difficulty === "Intermediate" ? "default" :
                      "outline"
                    }>
                      {project.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="text-sm text-muted-foreground">
                      {project.contributors}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" asChild><a href={project.link} target="_blank" rel="noopener noreferrer">Contribute</a></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MentorConnect;

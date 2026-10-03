import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, CheckCircle2, Circle, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { MindmapGenerator } from "@/components/MindmapGenerator";
import { useAuth } from "@/contexts/AuthContext";

const SkillRoadmap = () => {
  const { profile, saveProfile } = useAuth();
  const roleSkillsMap = {
    "SDE": [
      { name: "Data Structures & Algorithms", current: 0, target: 90 },
      { name: "System Design", current: 0, target: 85 },
      { name: "SQL & DBMS", current: 0, target: 80 },
      { name: "Object-Oriented Programming", current: 0, target: 85 },
      { name: "Git & Version Control", current: 0, target: 75 },
    ],
    "Data Scientist": [
      { name: "Python", current: 0, target: 90 },
      { name: "Machine Learning", current: 0, target: 90 },
      { name: "Statistics & Probability", current: 0, target: 85 },
      { name: "SQL", current: 0, target: 80 },
      { name: "Data Visualization", current: 0, target: 75 },
    ],
    "Data Engineer": [
      { name: "SQL", current: 0, target: 95 },
      { name: "Python/Scala", current: 0, target: 85 },
      { name: "Apache Spark", current: 0, target: 80 },
      { name: "ETL Pipelines", current: 0, target: 85 },
      { name: "Cloud Platforms (AWS/GCP)", current: 0, target: 75 },
    ],
    "DevOps Engineer": [
      { name: "Docker & Kubernetes", current: 0, target: 90 },
      { name: "CI/CD Pipelines", current: 0, target: 85 },
      { name: "Linux & Shell Scripting", current: 0, target: 85 },
      { name: "AWS/Azure/GCP", current: 0, target: 80 },
      { name: "Infrastructure as Code", current: 0, target: 75 },
    ],
    "Blockchain Developer": [
      { name: "Solidity", current: 0, target: 90 },
      { name: "Web3.js/Ethers.js", current: 0, target: 85 },
      { name: "Smart Contracts", current: 0, target: 90 },
      { name: "Ethereum/Polygon", current: 0, target: 80 },
      { name: "DeFi Concepts", current: 0, target: 75 },
    ],
    "Frontend Developer": [
      { name: "HTML/CSS/JavaScript", current: 0, target: 90 },
      { name: "React/Vue/Angular", current: 0, target: 85 },
      { name: "TypeScript", current: 0, target: 80 },
      { name: "Responsive Design", current: 0, target: 85 },
      { name: "Web Performance", current: 0, target: 75 },
    ],
    "UI/UX Designer": [
      { name: "Figma/Adobe XD", current: 0, target: 90 },
      { name: "User Research", current: 0, target: 85 },
      { name: "Prototyping", current: 0, target: 85 },
      { name: "Design Systems", current: 0, target: 80 },
      { name: "Interaction Design", current: 0, target: 75 },
    ],
    "Cybersecurity Engineer": [
      { name: "Network Security", current: 0, target: 90 },
      { name: "Penetration Testing", current: 0, target: 85 },
      { name: "Security Frameworks", current: 0, target: 80 },
      { name: "Cryptography", current: 0, target: 75 },
      { name: "Incident Response", current: 0, target: 80 },
    ],
  };

  const platformRecommendations: Record<string, Array<{ name?: string; url: string; description: string; youtube?: string }>> = {
    "Data Structures & Algorithms": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Comprehensive DSA course" },
      { name: "LeetCode", url: "https://leetcode.com/problemset/all/", description: "Top 100 interview questions" },
      { name: "Codeforces", url: "https://codeforces.com/", description: "Competitive programming" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "DSA tutorials by Harkirat Singh" },
    ],
    "System Design": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "System design masterclass" },
      { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", description: "Complete guide on GitHub" },
      { name: "Gaurav Sen YouTube", url: "https://www.youtube.com/@gkcs", description: "System design tutorials" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "System design by Harkirat Singh" },
    ],
    "SQL & DBMS": [
      { name: "LeetCode SQL", url: "https://leetcode.com/problemset/database/", description: "SQL practice problems" },
      { name: "StrataScratch", url: "https://www.stratascratch.com/", description: "Real interview SQL questions" },
    ],
    "SQL": [
      { name: "LeetCode SQL", url: "https://leetcode.com/problemset/database/", description: "SQL practice problems" },
      { name: "StrataScratch", url: "https://www.stratascratch.com/", description: "Real interview SQL questions" },
    ],
    "Python": [
      { name: "LeetCode Python", url: "https://leetcode.com/problemset/all/", description: "DSA problems in Python" },
      { name: "Kaggle Learn", url: "https://www.kaggle.com/learn/python", description: "Python tutorials" },
      { youtube: "Krish Naik", url: "https://www.youtube.com/@krishnaik06", description: "Python for Data Science" },
    ],
    "Machine Learning": [
      { name: "Kaggle Competitions", url: "https://www.kaggle.com/competitions", description: "ML competitions and datasets" },
      { name: "Andrew Ng Course", url: "https://www.coursera.org/learn/machine-learning", description: "ML fundamentals" },
      { youtube: "Krish Naik", url: "https://www.youtube.com/@krishnaik06", description: "ML tutorials and projects" },
      { youtube: "CampusX", url: "https://www.youtube.com/@campusx-official", description: "Applied ML with Python" },
    ],
    "Docker & Kubernetes": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "DevOps with Docker" },
      { name: "KodeKloud", url: "https://kodekloud.com/", description: "Docker & K8s hands-on labs" },
      { name: "Katacoda", url: "https://www.katacoda.com/", description: "Interactive learning platform" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Docker and Kubernetes tutorials" },
    ],
    "HTML/CSS/JavaScript": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Full-stack web development" },
      { name: "Frontend Mentor", url: "https://www.frontendmentor.io/", description: "Real-world projects" },
      { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", description: "Interactive coding challenges" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Web development tutorials" },
    ],
    "React/Vue/Angular": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "React and MERN stack" },
      { name: "Frontend Mentor", url: "https://www.frontendmentor.io/", description: "Build real projects" },
      { name: "LeetCode Frontend", url: "https://leetcode.com/problemset/javascript/", description: "JS coding problems" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "React and Next.js tutorials" },
    ],
    "Figma/Adobe XD": [
      { name: "Figma Community", url: "https://www.figma.com/community", description: "Design resources & templates" },
      { name: "Dribbble", url: "https://dribbble.com/", description: "Design inspiration" },
    ],
    "Network Security": [
      { name: "HackTheBox", url: "https://www.hackthebox.com/", description: "Penetration testing labs" },
      { name: "TryHackMe", url: "https://tryhackme.com/", description: "Cybersecurity training" },
    ],
    "Penetration Testing": [
      { name: "HackTheBox", url: "https://www.hackthebox.com/", description: "Advanced hacking challenges" },
      { name: "TryHackMe", url: "https://tryhackme.com/", description: "Guided penetration testing" },
    ],
    "Object-Oriented Programming": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "OOP with JavaScript/TypeScript" },
      { name: "LeetCode", url: "https://leetcode.com/problemset/all/", description: "OOP coding problems" },
      { name: "Design Patterns", url: "https://refactoring.guru/design-patterns", description: "Learn design patterns" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "OOP concepts explained" },
    ],
    "Git & Version Control": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Git and GitHub workflow" },
      { name: "GitHub Learning Lab", url: "https://lab.github.com/", description: "Interactive Git tutorials" },
      { name: "Git Immersion", url: "http://gitimmersion.com/", description: "Hands-on Git tutorial" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Git tutorials" },
    ],
    "Statistics & Probability": [
      { name: "Khan Academy", url: "https://www.khanacademy.org/math/statistics-probability", description: "Stats fundamentals" },
      { name: "Kaggle Learn", url: "https://www.kaggle.com/learn", description: "Data science stats" },
      { youtube: "Krish Naik", url: "https://www.youtube.com/@krishnaik06", description: "Statistics for ML" },
      { youtube: "CampusX", url: "https://www.youtube.com/@campusx-official", description: "Stats with Python" },
    ],
    "Data Visualization": [
      { name: "Kaggle Notebooks", url: "https://www.kaggle.com/notebooks", description: "Visualization examples" },
      { name: "Tableau Public", url: "https://public.tableau.com/", description: "Interactive dashboards" },
      { youtube: "Krish Naik", url: "https://www.youtube.com/@krishnaik06", description: "Data visualization tutorials" },
    ],
    "Python/Scala": [
      { name: "LeetCode", url: "https://leetcode.com/problemset/all/", description: "Coding practice" },
      { name: "Kaggle", url: "https://www.kaggle.com/", description: "Data engineering projects" },
    ],
    "Apache Spark": [
      { name: "Databricks Academy", url: "https://academy.databricks.com/", description: "Spark tutorials" },
      { name: "Spark Documentation", url: "https://spark.apache.org/docs/latest/", description: "Official docs" },
    ],
    "ETL Pipelines": [
      { name: "StrataScratch", url: "https://www.stratascratch.com/", description: "ETL interview questions" },
      { name: "Airflow Tutorial", url: "https://airflow.apache.org/docs/", description: "Workflow orchestration" },
    ],
    "Cloud Platforms (AWS/GCP)": [
      { name: "AWS Free Tier", url: "https://aws.amazon.com/free/", description: "Practice with free AWS" },
      { name: "Google Cloud Skills", url: "https://cloud.google.com/training", description: "GCP certifications" },
    ],
    "CI/CD Pipelines": [
      { name: "Jenkins Tutorial", url: "https://www.jenkins.io/doc/tutorials/", description: "CI/CD fundamentals" },
      { name: "GitHub Actions", url: "https://docs.github.com/en/actions", description: "Automation workflows" },
    ],
    "Linux & Shell Scripting": [
      { name: "Linux Journey", url: "https://linuxjourney.com/", description: "Learn Linux basics" },
      { name: "ShellCheck", url: "https://www.shellcheck.net/", description: "Shell script validator" },
    ],
    "AWS/Azure/GCP": [
      { name: "AWS Free Tier", url: "https://aws.amazon.com/free/", description: "Practice with AWS" },
      { name: "A Cloud Guru", url: "https://acloudguru.com/", description: "Cloud certifications" },
    ],
    "Infrastructure as Code": [
      { name: "Terraform Tutorials", url: "https://learn.hashicorp.com/terraform", description: "IaC with Terraform" },
      { name: "Pulumi", url: "https://www.pulumi.com/docs/", description: "Modern IaC" },
    ],
    "TypeScript": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "TypeScript with React" },
      { name: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html", description: "Official TS docs" },
      { name: "Frontend Mentor", url: "https://www.frontendmentor.io/", description: "TypeScript projects" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "TypeScript fundamentals" },
    ],
    "Responsive Design": [
      { name: "Frontend Mentor", url: "https://www.frontendmentor.io/", description: "Responsive projects" },
      { name: "CSS Grid Garden", url: "https://cssgridgarden.com/", description: "Learn CSS Grid" },
    ],
    "Web Performance": [
      { name: "Web.dev", url: "https://web.dev/learn/", description: "Performance optimization" },
      { name: "PageSpeed Insights", url: "https://pagespeed.web.dev/", description: "Analyze site speed" },
    ],
    "User Research": [
      { name: "Nielsen Norman Group", url: "https://www.nngroup.com/", description: "UX research articles" },
      { name: "UX Collective", url: "https://uxdesign.cc/", description: "UX case studies" },
    ],
    "Prototyping": [
      { name: "Figma Community", url: "https://www.figma.com/community", description: "Prototyping templates" },
      { name: "InVision", url: "https://www.invisionapp.com/", description: "Prototyping tool" },
    ],
    "Design Systems": [
      { name: "Material Design", url: "https://material.io/design", description: "Google's design system" },
      { name: "Design Systems Repo", url: "https://designsystemsrepo.com/", description: "Design system examples" },
    ],
    "Interaction Design": [
      { name: "Dribbble", url: "https://dribbble.com/", description: "Design inspiration" },
      { name: "Awwwards", url: "https://www.awwwards.com/", description: "Web design awards" },
    ],
    "Security Frameworks": [
      { name: "NIST Cybersecurity", url: "https://www.nist.gov/cyberframework", description: "Security frameworks" },
      { name: "OWASP", url: "https://owasp.org/", description: "Web application security" },
    ],
    "Cryptography": [
      { name: "Cryptopals", url: "https://cryptopals.com/", description: "Crypto challenges" },
      { name: "Khan Academy Crypto", url: "https://www.khanacademy.org/computing/computer-science/cryptography", description: "Crypto fundamentals" },
    ],
    "Incident Response": [
      { name: "SANS Incident Response", url: "https://www.sans.org/cyber-security-courses/", description: "IR training" },
      { name: "Blue Team Labs", url: "https://blueteamlabs.online/", description: "Defense challenges" },
    ],
    "Solidity": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Web3 and Blockchain development" },
      { name: "CryptoZombies", url: "https://cryptozombies.io/", description: "Learn Solidity by building games" },
      { name: "Solidity Documentation", url: "https://docs.soliditylang.org/", description: "Official Solidity docs" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Blockchain and Solidity tutorials" },
    ],
    "Web3.js/Ethers.js": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Web3 development course" },
      { name: "Ethereum.org", url: "https://ethereum.org/en/developers/docs/", description: "Ethereum development" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Web3.js tutorials" },
    ],
    "Smart Contracts": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Smart contract development" },
      { name: "OpenZeppelin", url: "https://docs.openzeppelin.com/contracts/", description: "Secure smart contract library" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Smart contract security" },
    ],
    "Ethereum/Polygon": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "Deploy on Ethereum/Polygon" },
      { name: "Polygon Docs", url: "https://docs.polygon.technology/", description: "Polygon development" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "Blockchain deployment guides" },
    ],
    "DeFi Concepts": [
      { name: "100xDevs", url: "https://app.100xdevs.com/", description: "DeFi protocols explained" },
      { name: "DeFi Pulse", url: "https://www.defipulse.com/", description: "DeFi analytics" },
      { youtube: "100xDevs YouTube", url: "https://www.youtube.com/@100xdevs", description: "DeFi development tutorials" },
    ],
  };

  const [selectedRole, setSelectedRole] = useState<keyof typeof roleSkillsMap>(
    (profile.selectedRole as keyof typeof roleSkillsMap) || "SDE",
  );
  const [skills, setSkills] = useState(
    profile.skillLevels?.[(profile.selectedRole as keyof typeof roleSkillsMap) || "SDE"] || roleSkillsMap[selectedRole],
  );

  const handleRoleChange = (role: keyof typeof roleSkillsMap) => {
    setSelectedRole(role);
    setSkills(profile.skillLevels?.[role] || roleSkillsMap[role]);
    void saveProfile({ selectedRole: role });
  };

  const updateSkillLevel = (index: number, value: number[]) => {
    const newSkills = [...skills];
    newSkills[index].current = value[0];
    setSkills(newSkills);
  };

  const getSkillStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return { label: "strong", variant: "default" as const };
    if (percentage >= 60) return { label: "good", variant: "secondary" as const };
    return { label: "learning", variant: "outline" as const };
  };

  const calculateOverallReadiness = () => {
    const totalCurrent = skills.reduce((sum, skill) => sum + skill.current, 0);
    const totalTarget = skills.reduce((sum, skill) => sum + skill.target, 0);
    return Math.round((totalCurrent / totalTarget) * 100);
  };

  const learningPath = [
    {
      title: "Master SQL Advanced Queries",
      duration: "2 weeks",
      completed: true,
      resources: ["SQLBolt Tutorial", "LeetCode SQL Problems"],
    },
    {
      title: "Python Data Science Libraries",
      duration: "4 weeks",
      completed: true,
      resources: ["Pandas Documentation", "Kaggle Tutorials"],
    },
    {
      title: "Machine Learning Fundamentals",
      duration: "8 weeks",
      completed: false,
      resources: ["Andrew Ng Course", "Scikit-learn Docs"],
    },
    {
      title: "Docker & Containerization",
      duration: "3 weeks",
      completed: false,
      resources: ["Docker Official Tutorial", "YouTube Docker Course"],
    },
    {
      title: "AWS Cloud Services",
      duration: "6 weeks",
      completed: false,
      resources: ["AWS Free Tier", "Cloud Guru Course"],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Skill Roadmap</h2>
        <p className="text-muted-foreground">Your personalized learning path to achieve your career goals</p>
      </div>

      <Tabs defaultValue="mindmap" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mindmap">Interactive Mindmap</TabsTrigger>
          <TabsTrigger value="skills">Skill Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="mindmap" className="space-y-6 mt-6">
          <MindmapGenerator />
        </TabsContent>

        <TabsContent value="skills" className="space-y-6 mt-6">

      {/* Role Selection */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Select Your Target Role</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose the tech career you're preparing for to see relevant skills and resources
          </p>
        </CardHeader>
        <CardContent>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="SDE">Software Development Engineer (SDE)</SelectItem>
              <SelectItem value="Data Scientist">Data Scientist</SelectItem>
              <SelectItem value="Data Engineer">Data Engineer</SelectItem>
              <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
              <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
              <SelectItem value="Blockchain Developer">Blockchain Developer</SelectItem>
              <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
              <SelectItem value="Cybersecurity Engineer">Cybersecurity Engineer</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Skill Self-Evaluation */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Self-Evaluate Your Skills</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust the sliders to rate your current skill level honestly
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {skills.map((skill, index) => {
            const status = getSkillStatus(skill.current, skill.target);
            return (
              <div key={index} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold">{skill.name}</h4>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">
                    {skill.current}% / {skill.target}%
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Current Proficiency</Label>
                  <Slider
                    value={[skill.current]}
                    onValueChange={(value) => updateSkillLevel(index, value)}
                    onValueCommit={(value) => {
                      const updatedSkills = skills.map((entry, skillIndex) =>
                        skillIndex === index ? { ...entry, current: value[0] } : entry,
                      );
                      void saveProfile({ skillLevels: { ...profile.skillLevels, [selectedRole]: updatedSkills } });
                    }}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <Progress value={skill.current} className="h-2" />
                </div>

                {/* Show platform recommendations when skill is below target */}
                {skill.current < skill.target && platformRecommendations[skill.name as keyof typeof platformRecommendations] && (
                  <div className="mt-4 p-4 bg-gradient-card border border-border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h5 className="font-semibold text-sm">Recommended Platforms to Improve</h5>
                    </div>
                    <div className="space-y-2">
                      {platformRecommendations[skill.name as keyof typeof platformRecommendations].map((platform, idx) => (
                        <a
                          key={idx}
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className="flex items-center justify-between p-3 bg-background/50 hover:bg-background border border-border rounded-md transition-all">
                            <div>
                              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                {platform.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{platform.description}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Celebration when target is reached */}
                {skill.current >= skill.target && (
                  <div className="mt-4 p-4 bg-gradient-hero/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <p className="font-semibold text-sm">Target Achieved! 🎉</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep practicing on these platforms to maintain your expertise
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Learning Path Timeline */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>6-Month Learning Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {learningPath.map((item, index) => {
              const completed = profile.learningProgress?.[item.title] || false;
              return (
              <div key={index} className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completed ? "bg-gradient-hero shadow-glow" : "bg-secondary"
                  }`}>
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {index < learningPath.length - 1 && (
                    <div className="w-0.5 h-full bg-border my-2"></div>
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <div className="bg-gradient-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{item.title}</h4>
                      <Badge variant="outline" className="ml-2">
                        {item.duration}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mb-3"
                      onClick={() => void saveProfile({
                        learningProgress: { ...profile.learningProgress, [item.title]: !completed },
                      })}
                    >
                      {completed ? "Mark in progress" : "Mark complete"}
                    </Button>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Recommended Resources:</p>
                      <div className="flex flex-wrap gap-2">
                        {item.resources.map((resource, idx) => (
                          <Button key={idx} variant="outline" size="sm" className="text-xs">
                            {resource}
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">Overall Readiness</h3>
              <p className="text-muted-foreground">For {selectedRole} Role</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {calculateOverallReadiness()}%
              </div>
              <p className="text-sm text-muted-foreground">Career Ready</p>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SkillRoadmap;

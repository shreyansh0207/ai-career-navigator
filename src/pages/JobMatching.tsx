import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, Building2, CalendarDays, ExternalLink, Globe, Linkedin, Loader2, Search, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, type JobFitAnalysis, type LiveJobListing, type LiveJobSearchResult, type SavedJob, type SavedJobStatus } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";

function getJobBoards(query: string, location: string) {
  const encodedQuery = encodeURIComponent(query);
  const encodedLocation = encodeURIComponent(location);
  const slug = query.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return [
    { name: "LinkedIn Jobs", url: `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=${encodedLocation}`, icon: Linkedin },
    { name: "YC Work at a Startup", url: `https://www.workatastartup.com/jobs?query=${encodedQuery}`, icon: Globe },
    { name: "Naukri", url: `https://www.naukri.com/${slug}-jobs?k=${encodedQuery}${location ? `&l=${encodedLocation}` : ""}`, icon: Globe },
    { name: "Internshala", url: `https://internshala.com/jobs/keywords-${slug}/`, icon: Globe },
    { name: "Remote.com", url: `https://remote.com/jobs?search=${encodedQuery}`, icon: Globe },
    { name: "Dice", url: `https://www.dice.com/jobs?q=${encodedQuery}&location=${encodedLocation}`, icon: Globe },
    { name: "ZS Careers", url: `https://jobs.zs.com/search-jobs/?keyword=${encodedQuery}`, icon: Globe },
  ];
}

const JobMatching = () => {
  const { profile, saveProfile } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState(profile.jobPreferences?.domain || "");
  const [searchQuery, setSearchQuery] = useState(profile.jobPreferences?.searchQuery || "");
  const [location, setLocation] = useState(profile.jobPreferences?.location || "");
  const [companyFilter, setCompanyFilter] = useState("");
  const [jobResults, setJobResults] = useState<LiveJobSearchResult | null>(null);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobError, setJobError] = useState("");
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(profile.savedJobs || []);
  const [scoringJobId, setScoringJobId] = useState("");
  // Company career pages and job platforms by domain
  const companyLinks: Record<string, Array<{name: string, careerUrl: string, linkedinUrl?: string}>> = {
    "MERN Stack": [
      { name: "MongoDB", careerUrl: "https://www.mongodb.com/careers", linkedinUrl: "https://www.linkedin.com/company/mongodb/jobs/" },
      { name: "Razorpay", careerUrl: "https://razorpay.com/jobs", linkedinUrl: "https://www.linkedin.com/company/razorpay/jobs/" },
      { name: "Zomato", careerUrl: "https://www.zomato.com/careers", linkedinUrl: "https://www.linkedin.com/company/zomato/jobs/" },
      { name: "Swiggy", careerUrl: "https://careers.swiggy.com", linkedinUrl: "https://www.linkedin.com/company/swiggy/jobs/" },
      { name: "PayTM", careerUrl: "https://jobs.lever.co/paytm", linkedinUrl: "https://www.linkedin.com/company/paytm/jobs/" },
      { name: "CRED", careerUrl: "https://careers.cred.club", linkedinUrl: "https://www.linkedin.com/company/cred-club/jobs/" },
    ],
    "Backend Development": [
      { name: "Google", careerUrl: "https://careers.google.com", linkedinUrl: "https://www.linkedin.com/company/google/jobs/" },
      { name: "Amazon", careerUrl: "https://www.amazon.jobs", linkedinUrl: "https://www.linkedin.com/company/amazon/jobs/" },
      { name: "Netflix", careerUrl: "https://jobs.netflix.com", linkedinUrl: "https://www.linkedin.com/company/netflix/jobs/" },
      { name: "Twitter", careerUrl: "https://careers.twitter.com", linkedinUrl: "https://www.linkedin.com/company/twitter/jobs/" },
      { name: "Stripe", careerUrl: "https://stripe.com/jobs", linkedinUrl: "https://www.linkedin.com/company/stripe/jobs/" },
      { name: "Atlassian", careerUrl: "https://www.atlassian.com/company/careers", linkedinUrl: "https://www.linkedin.com/company/atlassian/jobs/" },
      { name: "Salesforce", careerUrl: "https://www.salesforce.com/company/careers", linkedinUrl: "https://www.linkedin.com/company/salesforce/jobs/" },
      { name: "Oracle", careerUrl: "https://www.oracle.com/corporate/careers", linkedinUrl: "https://www.linkedin.com/company/oracle/jobs/" },
    ],
    "Frontend Development": [
      { name: "Vercel", careerUrl: "https://vercel.com/careers", linkedinUrl: "https://www.linkedin.com/company/vercel/jobs/" },
      { name: "Netlify", careerUrl: "https://www.netlify.com/careers", linkedinUrl: "https://www.linkedin.com/company/netlify/jobs/" },
      { name: "Shopify", careerUrl: "https://www.shopify.com/careers", linkedinUrl: "https://www.linkedin.com/company/shopify/jobs/" },
      { name: "Airbnb", careerUrl: "https://careers.airbnb.com", linkedinUrl: "https://www.linkedin.com/company/airbnb/jobs/" },
      { name: "Spotify", careerUrl: "https://www.lifeatspotify.com", linkedinUrl: "https://www.linkedin.com/company/spotify/jobs/" },
      { name: "GitHub", careerUrl: "https://github.com/about/careers", linkedinUrl: "https://www.linkedin.com/company/github/jobs/" },
      { name: "Discord", careerUrl: "https://discord.com/careers", linkedinUrl: "https://www.linkedin.com/company/discord/jobs/" },
    ],
    "Full Stack Development": [
      { name: "Microsoft", careerUrl: "https://careers.microsoft.com", linkedinUrl: "https://www.linkedin.com/company/microsoft/jobs/" },
      { name: "Meta", careerUrl: "https://www.metacareers.com", linkedinUrl: "https://www.linkedin.com/company/meta/jobs/" },
      { name: "Apple", careerUrl: "https://www.apple.com/careers", linkedinUrl: "https://www.linkedin.com/company/apple/jobs/" },
      { name: "LinkedIn", careerUrl: "https://careers.linkedin.com", linkedinUrl: "https://www.linkedin.com/company/linkedin/jobs/" },
      { name: "Uber", careerUrl: "https://www.uber.com/careers", linkedinUrl: "https://www.linkedin.com/company/uber-com/jobs/" },
      { name: "Dropbox", careerUrl: "https://www.dropbox.com/jobs", linkedinUrl: "https://www.linkedin.com/company/dropbox/jobs/" },
      { name: "Slack", careerUrl: "https://slack.com/careers", linkedinUrl: "https://www.linkedin.com/company/slack/jobs/" },
      { name: "Zoom", careerUrl: "https://careers.zoom.us", linkedinUrl: "https://www.linkedin.com/company/zoom-video-communications/jobs/" },
    ],
    "Android Development": [
      { name: "Google", careerUrl: "https://careers.google.com", linkedinUrl: "https://www.linkedin.com/company/google/jobs/" },
      { name: "Samsung", careerUrl: "https://www.samsung.com/us/careers", linkedinUrl: "https://www.linkedin.com/company/samsung-electronics/jobs/" },
      { name: "Xiaomi", careerUrl: "https://www.mi.com/global/about/careers", linkedinUrl: "https://www.linkedin.com/company/xiaomi/jobs/" },
      { name: "OnePlus", careerUrl: "https://www.oneplus.com/careers", linkedinUrl: "https://www.linkedin.com/company/oneplus/jobs/" },
      { name: "Flipkart", careerUrl: "https://www.flipkartcareers.com", linkedinUrl: "https://www.linkedin.com/company/flipkart/jobs/" },
      { name: "PhonePe", careerUrl: "https://www.phonepe.com/careers", linkedinUrl: "https://www.linkedin.com/company/phonepe/jobs/" },
      { name: "Dream11", careerUrl: "https://www.dream11.com/about-us/careers", linkedinUrl: "https://www.linkedin.com/company/dream11/jobs/" },
    ],
    "MLOps": [
      { name: "OpenAI", careerUrl: "https://openai.com/careers", linkedinUrl: "https://www.linkedin.com/company/openai/jobs/" },
      { name: "Databricks", careerUrl: "https://www.databricks.com/company/careers", linkedinUrl: "https://www.linkedin.com/company/databricks/jobs/" },
      { name: "Snowflake", careerUrl: "https://careers.snowflake.com", linkedinUrl: "https://www.linkedin.com/company/snowflake-computing/jobs/" },
      { name: "DeepMind", careerUrl: "https://www.deepmind.com/careers", linkedinUrl: "https://www.linkedin.com/company/deepmind/jobs/" },
      { name: "Hugging Face", careerUrl: "https://huggingface.co/careers", linkedinUrl: "https://www.linkedin.com/company/huggingface/jobs/" },
      { name: "Scale AI", careerUrl: "https://scale.com/careers", linkedinUrl: "https://www.linkedin.com/company/scaleai/jobs/" },
      { name: "Weights & Biases", careerUrl: "https://www.wandb.com/careers", linkedinUrl: "https://www.linkedin.com/company/wandb/jobs/" },
    ],
    "Data Science": [
      { name: "Netflix", careerUrl: "https://jobs.netflix.com", linkedinUrl: "https://www.linkedin.com/company/netflix/jobs/" },
      { name: "Airbnb", careerUrl: "https://careers.airbnb.com", linkedinUrl: "https://www.linkedin.com/company/airbnb/jobs/" },
      { name: "LinkedIn", careerUrl: "https://careers.linkedin.com", linkedinUrl: "https://www.linkedin.com/company/linkedin/jobs/" },
      { name: "PayPal", careerUrl: "https://www.paypal.com/careers", linkedinUrl: "https://www.linkedin.com/company/paypal/jobs/" },
      { name: "Adobe", careerUrl: "https://adobe.wd5.myworkdayjobs.com/external_experienced", linkedinUrl: "https://www.linkedin.com/company/adobe/jobs/" },
      { name: "IBM", careerUrl: "https://www.ibm.com/careers", linkedinUrl: "https://www.linkedin.com/company/ibm/jobs/" },
    ],
    "DevOps": [
      { name: "AWS", careerUrl: "https://www.amazon.jobs/en/teams/aws", linkedinUrl: "https://www.linkedin.com/company/amazon-web-services/jobs/" },
      { name: "Docker", careerUrl: "https://www.docker.com/careers", linkedinUrl: "https://www.linkedin.com/company/docker/jobs/" },
      { name: "HashiCorp", careerUrl: "https://www.hashicorp.com/careers", linkedinUrl: "https://www.linkedin.com/company/hashicorp/jobs/" },
      { name: "Red Hat", careerUrl: "https://www.redhat.com/en/jobs", linkedinUrl: "https://www.linkedin.com/company/red-hat/jobs/" },
      { name: "GitLab", careerUrl: "https://about.gitlab.com/jobs", linkedinUrl: "https://www.linkedin.com/company/gitlab-com/jobs/" },
      { name: "Kubernetes", careerUrl: "https://www.cncf.io/about/join", linkedinUrl: "https://www.linkedin.com/company/cloud-native-computing-foundation/jobs/" },
    ],
    "Cybersecurity": [
      { name: "Palo Alto Networks", careerUrl: "https://jobs.paloaltonetworks.com", linkedinUrl: "https://www.linkedin.com/company/palo-alto-networks/jobs/" },
      { name: "CrowdStrike", careerUrl: "https://www.crowdstrike.com/careers", linkedinUrl: "https://www.linkedin.com/company/crowdstrike/jobs/" },
      { name: "Cisco", careerUrl: "https://jobs.cisco.com", linkedinUrl: "https://www.linkedin.com/company/cisco/jobs/" },
      { name: "McAfee", careerUrl: "https://www.mcafee.com/enterprise/en-us/about/careers.html", linkedinUrl: "https://www.linkedin.com/company/mcafee/jobs/" },
      { name: "Fortinet", careerUrl: "https://www.fortinet.com/corporate/about-us/careers", linkedinUrl: "https://www.linkedin.com/company/fortinet/jobs/" },
    ],
    "Business & Analytics": [
      { name: "McKinsey & Company", careerUrl: "https://www.mckinsey.com/careers", linkedinUrl: "https://www.linkedin.com/company/mckinsey/jobs/" },
      { name: "BCG", careerUrl: "https://careers.bcg.com", linkedinUrl: "https://www.linkedin.com/company/boston-consulting-group/jobs/" },
      { name: "Deloitte", careerUrl: "https://www2.deloitte.com/careers", linkedinUrl: "https://www.linkedin.com/company/deloitte/jobs/" },
      { name: "PwC", careerUrl: "https://www.pwc.com/gx/en/careers.html", linkedinUrl: "https://www.linkedin.com/company/pwc/jobs/" },
      { name: "Accenture", careerUrl: "https://www.accenture.com/careers", linkedinUrl: "https://www.linkedin.com/company/accenture/jobs/" },
      { name: "KPMG", careerUrl: "https://home.kpmg/careers", linkedinUrl: "https://www.linkedin.com/company/kpmg/jobs/" },
      { name: "EY", careerUrl: "https://www.ey.com/en_gl/careers", linkedinUrl: "https://www.linkedin.com/company/ernstandyoung/jobs/" },
    ],
    "UI/UX Design": [
      { name: "Figma", careerUrl: "https://www.figma.com/careers", linkedinUrl: "https://www.linkedin.com/company/figma/jobs/" },
      { name: "Adobe", careerUrl: "https://adobe.wd5.myworkdayjobs.com/external_experienced", linkedinUrl: "https://www.linkedin.com/company/adobe/jobs/" },
      { name: "Canva", careerUrl: "https://www.canva.com/careers", linkedinUrl: "https://www.linkedin.com/company/canva/jobs/" },
      { name: "InVision", careerUrl: "https://www.invisionapp.com/careers", linkedinUrl: "https://www.linkedin.com/company/invision/jobs/" },
      { name: "Sketch", careerUrl: "https://www.sketch.com/careers", linkedinUrl: "https://www.linkedin.com/company/sketch/jobs/" },
    ],
  };

  const boardQuery = searchQuery.trim() || selectedDomain || "software developer";
  const jobPortals = getJobBoards(boardQuery, location);

  const saveJobPreferences = (domain: string, query: string, preferredLocation: string) => {
    void saveProfile({ jobPreferences: { domain, searchQuery: query, location: preferredLocation } });
  };

  const searchLiveJobs = async () => {
    const query = searchQuery.trim() || selectedDomain.trim();
    if (query.length < 2) {
      setJobError("Choose a domain or enter a job title or skill to search.");
      return;
    }
    setIsSearchingJobs(true);
    setJobError("");
    try {
      const params = new URLSearchParams({ q: query, location: location.trim() });
      const result = await apiRequest<LiveJobSearchResult>(`/jobs/search?${params.toString()}`);
      setJobResults(result);
      saveJobPreferences(selectedDomain, query, location);
    } catch (error) {
      setJobError(error instanceof Error ? error.message : "Could not load live job listings.");
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const saveJob = async (job: LiveJobListing) => {
    if (savedJobs.some((saved) => saved.id === job.id)) return;
    const next = [{ ...job, savedAt: new Date().toISOString(), status: "saved" as const, notes: "", followUpDate: "" }, ...savedJobs];
    setSavedJobs(next);
    try {
      await saveProfile({ savedJobs: next });
    } catch (error) {
      setSavedJobs(savedJobs);
      setJobError(error instanceof Error ? error.message : "Could not save this job.");
    }
  };

  const updateSavedJob = async (jobId: string, updates: Partial<Pick<SavedJob, "status" | "notes" | "followUpDate">>) => {
    const next = savedJobs.map((job) => job.id === jobId ? { ...job, ...updates } : job);
    setSavedJobs(next);
    try {
      await saveProfile({ savedJobs: next });
    } catch (error) {
      setJobError(error instanceof Error ? error.message : "Could not update this saved job.");
    }
  };

  const saveJobDraft = async () => {
    try {
      await saveProfile({ savedJobs });
    } catch (error) {
      setJobError(error instanceof Error ? error.message : "Could not save your job notes.");
    }
  };

  const removeSavedJob = async (jobId: string) => {
    const next = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(next);
    try {
      await saveProfile({ savedJobs: next });
    } catch (error) {
      setJobError(error instanceof Error ? error.message : "Could not remove this saved job.");
    }
  };

  const analyzeJobFit = async (job: LiveJobListing) => {
    setScoringJobId(job.id);
    setJobError("");
    try {
      const analysis = await apiRequest<JobFitAnalysis>("/ai/job-fit", {
        method: "POST",
        body: JSON.stringify({ job }),
      });
      await saveProfile({ jobFitAnalyses: { ...profile.jobFitAnalyses, [job.id]: analysis } });
    } catch (error) {
      setJobError(error instanceof Error ? error.message : "Could not analyze this job against your profile.");
    } finally {
      setScoringJobId("");
    }
  };

  const updateDraftField = (jobId: string, field: "notes" | "followUpDate", value: string) => {
    setSavedJobs((current) => current.map((job) => job.id === jobId ? { ...job, [field]: value } : job));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Smart Job Matching</h2>
        <p className="text-muted-foreground">Find jobs and apply directly to top companies in your domain</p>
      </div>

      {/* Domain Search Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Jobs by Domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Select Your Domain</Label>
              <Select value={selectedDomain} onValueChange={(domain) => {
                setSelectedDomain(domain);
                saveJobPreferences(domain, searchQuery, location);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MERN Stack">MERN Stack Developer</SelectItem>
                  <SelectItem value="Backend Development">Backend Development</SelectItem>
                  <SelectItem value="Frontend Development">Frontend Development</SelectItem>
                  <SelectItem value="Full Stack Development">Full Stack Development</SelectItem>
                  <SelectItem value="Android Development">Android Development</SelectItem>
                  <SelectItem value="MLOps">MLOps Engineering</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="DevOps">DevOps Engineering</SelectItem>
                  <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="Business & Analytics">Business & Analytics</SelectItem>
                  <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Job Title or Skills</Label>
              <Input
                id="search"
                placeholder="e.g., frontend engineer, React, SQL"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => saveJobPreferences(selectedDomain, searchQuery, location)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., India, United States, Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => saveJobPreferences(selectedDomain, searchQuery, location)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-filter">Filter Company List</Label>
              <Input
                id="company-filter"
                placeholder="e.g., Google, Amazon"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Job board searches */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">Search {boardQuery} on job boards</h3>
            <p className="text-sm text-muted-foreground mb-3">These open current searches on each provider; availability and sign-in requirements vary by site.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              {jobPortals.map((portal) => {
                const Icon = portal.icon;
                return (
                  <Button
                    key={portal.name}
                    variant="outline"
                    className="h-auto flex flex-col items-center gap-2 p-4"
                    asChild
                  >
                    <a href={portal.url} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-5 w-5" />
                      <span className="text-xs text-center">{portal.name}</span>
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Company Career Pages */}
          {selectedDomain && companyLinks[selectedDomain] && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Top Companies in {selectedDomain}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {companyLinks[selectedDomain]
                  .filter((company) =>
                      companyFilter
                        ? company.name.toLowerCase().includes(companyFilter.toLowerCase())
                      : true
                  )
                  .map((company) => (
                    <Card key={company.name} className="shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold">{company.name}</h4>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-hero hover:opacity-90"
                            asChild
                          >
                            <a href={company.careerUrl} target="_blank" rel="noopener noreferrer">
                              <Globe className="mr-2 h-4 w-4" />
                              Career Page
                            </a>
                          </Button>
                          {company.linkedinUrl && (
                            <Button size="sm" variant="outline" className="flex-1" asChild>
                              <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="mr-2 h-4 w-4" />
                                LinkedIn Jobs
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Latest Live Openings</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Recent listings from RemoteOK and Arbeitnow, filtered by role and location.</p>
          </div>
          <Button onClick={() => void searchLiveJobs()} disabled={isSearchingJobs}>
            {isSearchingJobs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {isSearchingJobs ? "Searching" : "Search latest"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobError && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{jobError}</p>}
          {jobResults && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Sources: {jobResults.sources.map((source) => `${source.name} ${source.available ? `(${source.count})` : "(temporarily unavailable)"}`).join(" · ")}
              </span>
              <span>Fetched {new Date(jobResults.fetchedAt).toLocaleString()}</span>
            </div>
          )}
          {jobResults?.jobs.length ? (
            jobResults.jobs.map((job) => {
              const isSaved = savedJobs.some((saved) => saved.id === job.id);
              const fit = profile.jobFitAnalyses?.[job.id];
              return (
              <article key={job.id} className="border-b border-border py-4 last:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-base font-semibold text-foreground">{job.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.company} · {job.location}</p>
                  </div>
                  {job.remote && <Badge variant="secondary">Remote</Badge>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.summary || "Open the source listing for role details."}</p>
                {job.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.tags.slice(0, 7).map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant={isSaved ? "secondary" : "outline"} onClick={() => void saveJob(job)} disabled={isSaved}>
                    <Bookmark className="mr-2 h-4 w-4" />{isSaved ? "Saved to tracker" : "Save job"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void analyzeJobFit(job)} disabled={scoringJobId === job.id}>
                    {scoringJobId === job.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {scoringJobId === job.id ? "Analyzing" : "Analyze my fit"}
                  </Button>
                </div>
                {fit && (
                  <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">AI fit: {fit.fitScore}%</p>
                        <p className="mt-1 text-sm text-muted-foreground">{fit.summary}</p>
                      </div>
                      <Badge variant="secondary">Profile-based</Badge>
                    </div>
                    {fit.skillGaps.length > 0 && <p className="mt-2 text-xs text-muted-foreground"><strong>Skill gaps:</strong> {fit.skillGaps.join(", ")}</p>}
                    {fit.nextSteps.length > 0 && <p className="mt-1 text-xs text-muted-foreground"><strong>Next steps:</strong> {fit.nextSteps.join(" · ")}</p>}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  {job.postedAt && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Posted {new Date(job.postedAt).toLocaleDateString()}</span>}
                  <span>Source: {job.source}</span>
                  <a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={job.url} target="_blank" rel="noopener noreferrer">
                    View opening at {job.source} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
              );
            })
          ) : jobResults ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No recent openings matched this search. Try another title, skill, or location.</p>
          ) : !jobError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Choose a domain or enter a title, then select Search latest.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Saved Jobs & Application Tracker</span>
            <Badge variant="secondary">{savedJobs.length} saved</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Track application status, follow-up dates, and notes. These records are saved to your candidate account.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedJobs.length ? savedJobs.map((job) => {
            const fit = profile.jobFitAnalyses?.[job.id];
            return (
              <article key={job.id} className="border-b border-border pb-5 last:border-b-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-base font-semibold">{job.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.company} · {job.location} · Saved {new Date(job.savedAt).toLocaleDateString()}</p>
                    <a className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" href={job.url} target="_blank" rel="noopener noreferrer">
                      Original listing ({job.source}) <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {fit && <Badge variant="outline">AI fit {fit.fitScore}%</Badge>}
                    <Button variant="ghost" size="icon" aria-label={`Remove ${job.title} from saved jobs`} onClick={() => void removeSavedJob(job.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`status-${job.id}`}>Application status</Label>
                    <Select value={job.status} onValueChange={(status) => void updateSavedJob(job.id, { status: status as SavedJobStatus })}>
                      <SelectTrigger id={`status-${job.id}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saved">Saved</SelectItem>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`follow-up-${job.id}`}>Follow-up date</Label>
                    <Input id={`follow-up-${job.id}`} type="date" value={job.followUpDate} onChange={(event) => updateDraftField(job.id, "followUpDate", event.target.value)} onBlur={() => void saveJobDraft()} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`notes-${job.id}`}>Application notes</Label>
                    <Textarea id={`notes-${job.id}`} value={job.notes} placeholder="Recruiter, next step, or interview notes" rows={2} maxLength={4000} onChange={(event) => updateDraftField(job.id, "notes", event.target.value)} onBlur={() => void saveJobDraft()} />
                  </div>
                </div>
              </article>
            );
          }) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Save a live opening to start tracking your applications here.</p>
          )}
        </CardContent>
      </Card>

      {/* Search Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selected Domain</p>
                <p className="text-lg font-semibold">{selectedDomain || "Not selected"}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recent live openings</p>
                <p className="text-3xl font-bold">{jobResults?.jobs.length ?? "—"}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Live sources online</p>
                <p className="text-3xl font-bold">{jobResults ? jobResults.sources.filter((source) => source.available).length : "—"}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!selectedDomain && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            Select a domain to explore company career pages, or search by a title or skill for recent openings.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobMatching;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

interface CareerPath {
  role: string;
  match: number;
  reason: string;
}

interface AnalysisResult {
  summary?: string;
  atsScore?: number;
  atsBreakdown?: { category: string; score: number; feedback: string }[];
  skills: string[];
  experienceLevel: string;
  careerPaths: CareerPath[];
  foundKeywords?: string[];
  missingKeywords?: string[];
  strengths: string[];
  improvements: string[];
  rewriteSuggestions?: { original: string; improved: string }[];
}

function normalizeAnalysis(value: unknown): AnalysisResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  const records = (items: unknown) => Array.isArray(items)
    ? items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
  const strings = (items: unknown) => Array.isArray(items)
    ? items.filter((item): item is string => typeof item === "string")
    : [];
  const score = Number(result.atsScore);

  return {
    summary: typeof result.summary === "string" ? result.summary : "",
    atsScore: Number.isFinite(score) ? score : 0,
    atsBreakdown: records(result.atsBreakdown).map((item) => ({
      category: typeof item.category === "string" ? item.category : "",
      score: Number(item.score) || 0,
      feedback: typeof item.feedback === "string" ? item.feedback : "",
    })),
    skills: strings(result.skills),
    experienceLevel: typeof result.experienceLevel === "string" ? result.experienceLevel : "Not specified",
    careerPaths: records(result.careerPaths).map((item) => ({
      role: typeof item.role === "string" ? item.role : "Career track",
      match: Number(item.match) || 0,
      reason: typeof item.reason === "string" ? item.reason : "",
    })),
    foundKeywords: strings(result.foundKeywords),
    missingKeywords: strings(result.missingKeywords),
    strengths: strings(result.strengths),
    improvements: strings(result.improvements),
    rewriteSuggestions: records(result.rewriteSuggestions).map((item) => ({
      original: typeof item.original === "string" ? item.original : "",
      improved: typeof item.improved === "string" ? item.improved : "",
    })),
  };
}

const CareerMapping = () => {
  const { profile, saveProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(profile.resumeText || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => normalizeAnalysis(profile.careerAnalysis));
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  // Helpers: extract text from PDF and DOCX files in-browser
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      fullText += strings + '\n';
    }
    return fullText;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const mammothLib = await import('mammoth/mammoth.browser');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammothLib.extractRawText({ arrayBuffer });
    return (result?.value as string) || '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      let text = '';

      if (fileExtension === 'txt') {
        text = await selectedFile.text();
      } else if (fileExtension === 'pdf') {
        text = await extractTextFromPdf(selectedFile);
      } else if (fileExtension === 'docx') {
        text = await extractTextFromDocx(selectedFile);
      } else if (fileExtension === 'doc') {
        toast({
          title: 'DOC format not supported',
          description: 'Please save your file as DOCX and upload again',
          variant: 'destructive',
        });
        setFile(null);
        return;
      } else {
        toast({
          title: 'Unsupported format',
          description: 'Please upload TXT, PDF, or DOCX files',
          variant: 'destructive',
        });
        setFile(null);
        return;
      }

      text = text.trim();
      if (!text) {
        toast({
          title: 'No text extracted',
          description: 'Could not extract text from the file. Please paste your resume text below.',
          variant: 'destructive',
        });
        setFile(null);
        return;
      }

      const MAX_LEN = 15000;
      if (text.length > MAX_LEN) {
        text = text.slice(0, MAX_LEN);
        toast({
          title: 'Text truncated',
          description: 'Your resume exceeded 15,000 characters and has been truncated for analysis.',
        });
      }

      setResumeText(text);
      void saveProfile({ resumeText: text }).catch((error) => {
        toast({ title: "Resume not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
      });
      toast({
        title: 'File loaded',
        description: 'Resume content extracted successfully',
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: 'Error',
        description: 'Failed to read file',
        variant: 'destructive',
      });
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText || resumeText.trim().length === 0) {
      toast({
        title: "No text provided",
        description: "Please paste your resume text in the text area",
        variant: "destructive",
      });
      return;
    }

    if (resumeText.length > 15000) {
      toast({
        title: "Text too long",
        description: "Please shorten your resume to under 15,000 characters",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const data = await apiRequest<AnalysisResult>("/ai/analyze-resume", {
        method: "POST",
        body: JSON.stringify({ resumeText: resumeText.trim() }),
      });

      const normalized = normalizeAnalysis(data);
      if (!normalized) {
        throw new Error('Invalid analysis response. Please try again.');
      }

      setAnalysis(normalized);
      await saveProfile({ resumeText: resumeText.trim(), careerAnalysis: normalized as unknown as Record<string, unknown> });
      toast({
        title: "✨ Analysis Complete!",
        description: `Found ${normalized.skills.length} skills and ${normalized.careerPaths.length} career paths`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze resume. Please try again.';
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">AI Career Mapping</h2>
        <p className="text-muted-foreground">Upload your resume and get AI-powered analysis of your skills with personalized career path recommendations</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-file">Upload File</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-primary bg-primary/10 scale-105' 
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-file')?.click()}
              >
                <input
                  type="file"
                  id="resume-file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className={`h-12 w-12 mx-auto mb-4 transition-all ${
                  isDragging ? 'text-primary animate-bounce' : 'text-muted-foreground'
                }`} />
                <p className="text-sm font-medium mb-2">
                  {isDragging ? '📄 Drop your file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports TXT, PDF, DOCX (DOC not supported)
                </p>
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm bg-secondary/50 p-3 rounded-md">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
              {resumeText && (
                <div className="bg-secondary/50 p-3 rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">Resume Preview:</p>
                  <p className="text-sm line-clamp-3">{resumeText}</p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or paste text</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume Text</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                onBlur={() => {
                  void saveProfile({ resumeText }).catch((error) => {
                    toast({ title: "Resume not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
                  });
                }}
                rows={8}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={analyzing || isParsing}
              className="w-full bg-gradient-hero hover:opacity-90 shadow-glow"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing file...
                </>
              ) : (
                'Analyze Resume'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Career Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI is analyzing your resume...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {typeof analysis.atsScore === "number" && (
                  <div className="rounded-lg border border-border bg-gradient-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">ATS Score</h4>
                      <span className="text-3xl font-bold text-primary">{analysis.atsScore}/100</span>
                    </div>
                    <Progress value={analysis.atsScore} className="h-2" />
                    {analysis.summary && (
                      <p className="text-sm text-muted-foreground mt-3">{analysis.summary}</p>
                    )}
                    {analysis.atsBreakdown && analysis.atsBreakdown.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {analysis.atsBreakdown.map((b, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{b.category}</span>
                              <span>{b.score}%</span>
                            </div>
                            <Progress value={b.score} className="h-1.5 my-1" />
                            <p className="text-xs text-muted-foreground">{b.feedback}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Keywords to Add</h4>
                    <p className="text-xs text-muted-foreground mb-2">Add these to your resume to pass ATS filters</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((k, i) => (
                        <Badge key={i} className="bg-primary/15 text-primary hover:bg-primary/20">+ {k}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.foundKeywords && analysis.foundKeywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Keywords Already Found</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.foundKeywords.map((k, i) => (
                        <Badge key={i} variant="secondary">{k}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.rewriteSuggestions && analysis.rewriteSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Suggested Rewrites</h4>
                    <div className="space-y-3">
                      {analysis.rewriteSuggestions.map((r, i) => (
                        <div key={i} className="rounded-md border border-border p-3 text-sm space-y-1">
                          <p className="text-muted-foreground line-through">{r.original}</p>
                          <p className="font-medium">→ {r.improved}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Experience Level</h4>
                  <Badge variant="secondary" className="text-base px-4 py-1">
                    {analysis.experienceLevel}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Identified Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Key Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    Areas for Improvement
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {analysis.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-muted-foreground leading-relaxed">{improvement}</li>
                    ))}
                  </ul>
                </div>

                {resumeText && (
                  <div>
                    <h4 className="font-semibold mb-3">Resume Content</h4>
                    <div className="bg-secondary/30 p-4 rounded-md max-h-48 overflow-y-auto">
                      <p className="text-xs whitespace-pre-wrap">{resumeText}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload your resume or paste text to see AI-powered analysis
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggested Career Tracks */}
      {analysis && analysis.careerPaths.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Suggested Career Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {analysis.careerPaths.map((path, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary transition-colors">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{path.role}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{path.reason}</p>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gradient-hero text-primary-foreground shadow-glow">
                        {path.match}% Match
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerMapping;

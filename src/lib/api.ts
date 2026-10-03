import { isDemoMode } from "./demoMode";
import { handleLocalApi } from "./localBackend";

const tokenKey = "skillquest.session";

export interface CandidateUser {
  id: string;
  displayName: string;
  email: string;
}

export interface InterviewSession {
  id: string;
  type: "hr" | "technical";
  role: string;
  focusArea: string;
  date: string;
  score: number;
  answers: Array<{
    questionId: number;
    answer: string;
    evaluation?: {
      score: number;
      strengths: string[];
      improvements: string[];
      feedback: string;
    };
  }>;
  questions: Array<{
    id: number;
    question: string;
    category: string;
    difficulty: string;
    expectedPoints: string[];
    timeLimit: string;
  }>;
  completed: boolean;
}

export interface LiveJobListing {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  postedAt: string | null;
  url: string;
  tags: string[];
  summary: string;
}

export interface LiveJobSearchResult {
  query: string;
  location: string;
  fetchedAt: string;
  sources: Array<{ name: string; available: boolean; count: number }>;
  jobs: LiveJobListing[];
}

export type SavedJobStatus = "saved" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";

export interface SavedJob extends LiveJobListing {
  savedAt: string;
  status: SavedJobStatus;
  notes: string;
  followUpDate: string;
}

export interface JobFitAnalysis {
  fitScore: number;
  summary: string;
  strengths: string[];
  skillGaps: string[];
  nextSteps: string[];
}

export interface CandidateProfile {
  resumeText?: string;
  careerAnalysis?: Record<string, unknown> | null;
  roadmapData?: Record<string, unknown> | null;
  roadmapRequest?: { domain: string; learningGoal: string; availableHours: string };
  mindmap?: {
    domain: string;
    learningGoal: string;
    nodes: Array<{ id: string; label: string; category?: string; level: number }>;
    edges: Array<{ from: string; to: string }>;
  } | null;
  selectedRole?: string;
  skillLevels?: Record<string, Array<{ name: string; current: number; target: number }>>;
  learningProgress?: Record<string, boolean>;
  interviews?: InterviewSession[];
  jobPreferences?: { domain: string; searchQuery: string; location?: string };
  savedJobs?: SavedJob[];
  jobFitAnalyses?: Record<string, JobFitAnalysis>;
  mentorRequests?: string[];
}

export function getSessionToken() {
  return localStorage.getItem(tokenKey);
}

export function setSessionToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isDemoMode) return handleLocalApi<T>(path, options);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getSessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`/api${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/register") setSessionToken(null);
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result as T;
}

export function saveCandidateProfile(profile: Partial<CandidateProfile>) {
  return apiRequest<{ profile: CandidateProfile }>("/candidate/profile", {
    method: "PATCH",
    body: JSON.stringify({ profile }),
  });
}
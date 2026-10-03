// Browser-based replacement for the Express API used by the static demo build.
// It mirrors server/index.js endpoint-by-endpoint: same routes, same
// validation, same error messages, same response shapes. Accounts and profiles
// are stored in localStorage; AI calls go straight to Groq with a key the
// visitor supplies, falling back to the offline engine in offlineAi.ts.

import { toast } from "sonner";
import { getGroqKey, openAiSettings } from "./demoMode";
import { groqJson, normalizeQuestions, objectArray, stringArray, type NormalizedQuestion } from "./groqClient";
import {
  offlineEvaluateAnswer,
  offlineInterviewQuestions,
  offlineJobFit,
  offlineMindmap,
  offlineResumeAnalysis,
  offlineRoadmap,
} from "./offlineAi";

const sessionKey = "skillquest.session";
const usersKey = "skillquest.demo.users";
const jobFeedStorageKey = "skillquest.demo.jobFeed";
const profileFields = new Set([
  "resumeText",
  "careerAnalysis",
  "roadmapData",
  "roadmapRequest",
  "mindmap",
  "selectedRole",
  "skillLevels",
  "learningProgress",
  "interviews",
  "jobPreferences",
  "savedJobs",
  "jobFitAnalyses",
  "mentorRequests",
]);

interface DemoUser {
  id: string;
  displayName: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
  profile: Record<string, unknown>;
}

class DemoApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function readUsers(): DemoUser[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(usersKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: DemoUser[]) {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // Non-secure context fallback (demo only): simple deterministic hash
  let hash = 2166136261;
  const source = `${salt}:${password}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function currentUserId(): string | null {
  const token = localStorage.getItem(sessionKey);
  if (!token || !token.startsWith("demo.")) return null;
  const [, userId, expiry] = token.split(".");
  if (!userId || !expiry || Number(expiry) < Date.now()) return null;
  return userId;
}

function requireUser(): DemoUser {
  const userId = currentUserId();
  if (!userId) {
    const error = new DemoApiError("Your session has expired. Please sign in again.", 401);
    if (!localStorage.getItem(sessionKey)) error.message = "Sign in to continue";
    throw error;
  }
  const user = readUsers().find((item) => item.id === userId);
  if (!user) {
    throw new DemoApiError("Your session has expired. Please sign in again.", 401);
  }
  return user;
}

function publicUser(user: DemoUser) {
  return { id: user.id, displayName: user.displayName, email: user.email };
}

function createSession(userId: string) {
  const token = `demo.${userId}.${Date.now() + 7 * 24 * 60 * 60 * 1000}`;
  localStorage.setItem(sessionKey, token);
  return token;
}

function updateUser(userId: string, mutate: (user: DemoUser) => void) {
  const users = readUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) throw new DemoApiError("Account not found", 404);
  mutate(user);
  writeUsers(users);
  return user;
}

// ---------- AI helpers ----------

let offlineNoticeShown = false;

function notifyOfflineUse() {
  if (offlineNoticeShown || sessionStorage.getItem("skillquest.offlineNotice")) return;
  offlineNoticeShown = true;
  sessionStorage.setItem("skillquest.offlineNotice", "1");
  toast.info("Offline AI mode is active", {
    id: "offline-ai",
    description: "Smart built-in results are being used. Add a free Groq API key anytime for live AI.",
    action: { label: "Add Groq key", onClick: () => openAiSettings() },
    duration: 8000,
  });
}

async function withAi<T>(groqFn: (apiKey: string) => Promise<T>, offlineFn: () => T): Promise<T> {
  const apiKey = getGroqKey();
  if (apiKey) {
    try {
      return await groqFn(apiKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Groq request failed";
      if ((error as Error & { status?: number }).status === 401) {
        toast.error("Groq API key was rejected", {
          id: "groq-rejected",
          description: "Remove and re-add your key in AI Settings. Using offline AI for now.",
          action: { label: "Open settings", onClick: () => openAiSettings() },
        });
      } else {
        toast.warning("Groq unavailable — offline AI used", {
          id: "groq-fallback",
          description: message,
        });
      }
      return offlineFn();
    }
  }
  notifyOfflineUse();
  return offlineFn();
}

// ---------- Job feed ----------

const jobFeedCacheMs = 5 * 60 * 1000;
const recentJobWindowMs = 60 * 24 * 60 * 60 * 1000;
let jobFeedCache: { jobs: StoredJob[]; sources: Array<{ name: string; available: boolean; count: number }>; fetchedAt: string } | null = null;
let jobFeedCacheTime = 0;

interface StoredJob {
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

function plainText(value: unknown): string {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function validJobUrl(value: unknown): string {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeRemoteOkJob(job: Record<string, unknown>): StoredJob | null {
  const url = validJobUrl(job.url || job.apply_url);
  if (!url || !job.position) return null;
  return {
    id: `remoteok-${job.id || job.slug || url}`,
    source: "RemoteOK",
    title: String(job.position),
    company: String(job.company || "Company not listed"),
    location: String(job.location || "Remote"),
    remote: true,
    postedAt: typeof job.date === "string" ? job.date : null,
    url,
    tags: stringArray(job.tags),
    summary: plainText(job.description).slice(0, 320),
  };
}

function normalizeArbeitnowJob(job: Record<string, unknown>): StoredJob | null {
  const url = validJobUrl(job.url);
  if (!url || !job.title) return null;
  return {
    id: `arbeitnow-${job.slug || url}`,
    source: "Arbeitnow",
    title: String(job.title),
    company: String(job.company_name || "Company not listed"),
    location: String(job.location || (job.remote ? "Remote" : "Location not listed")),
    remote: Boolean(job.remote),
    postedAt: typeof job.created_at === "string" ? job.created_at : null,
    url,
    tags: stringArray(job.tags),
    summary: plainText(job.description).slice(0, 320),
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Job source returned HTTP ${response.status}`);
  return response.json();
}

async function getLiveJobFeeds() {
  if (jobFeedCache && Date.now() - jobFeedCacheTime < jobFeedCacheMs) return jobFeedCache;

  const feeds = await Promise.allSettled([
    fetchJson("https://remoteok.com/api").then((payload) => ({
      name: "RemoteOK",
      jobs: Array.isArray(payload)
        ? (payload.slice(1) as Record<string, unknown>[]).map(normalizeRemoteOkJob).filter((job): job is StoredJob => Boolean(job))
        : [],
    })),
    fetchJson("https://www.arbeitnow.com/api/job-board-api").then((payload) => {
      const record = payload as { data?: unknown };
      return {
        name: "Arbeitnow",
        jobs: Array.isArray(record?.data)
          ? (record.data as Record<string, unknown>[]).map(normalizeArbeitnowJob).filter((job): job is StoredJob => Boolean(job))
          : [],
      };
    }),
  ]);

  const sources = feeds.map((result, index) => {
    const name = index === 0 ? "RemoteOK" : "Arbeitnow";
    if (result.status === "fulfilled") return { name, available: true, count: result.value.jobs.length };
    console.warn(`${name} job feed unavailable:`, result.reason?.message || "Unknown error");
    return { name, available: false, count: 0 };
  });
  const jobs = feeds.flatMap((result) => (result.status === "fulfilled" ? result.value.jobs : []));

  if (!jobs.length) {
    try {
      const stored = JSON.parse(localStorage.getItem(jobFeedStorageKey) || "null");
      if (stored && Array.isArray(stored.jobs) && stored.jobs.length) {
        jobFeedCache = stored;
        jobFeedCacheTime = Date.now();
        return jobFeedCache;
      }
    } catch {
      // fall through to the unavailable error
    }
    throw new DemoApiError("Live job feeds are temporarily unavailable. Try again shortly.", 503);
  }

  jobFeedCache = { jobs, sources, fetchedAt: new Date().toISOString() };
  jobFeedCacheTime = Date.now();
  try {
    localStorage.setItem(jobFeedStorageKey, JSON.stringify(jobFeedCache));
  } catch {
    // Storage full/unavailable: cache stays in memory only.
  }
  return jobFeedCache;
}

function jobMatches(job: StoredJob, query: string, location: string) {
  const haystack = `${job.title} ${job.company} ${job.tags.join(" ")} ${job.summary}`.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const terms = normalizedQuery.split(/[\s/,+-]+/).filter((term) => term.length > 2);
  const queryMatches = !terms.length || haystack.includes(normalizedQuery) ||
    terms.filter((term) => haystack.includes(term)).length >= Math.ceil(terms.length / 2);
  const normalizedLocation = location.trim().toLowerCase();
  const locationMatches = !normalizedLocation || normalizedLocation === "remote" || job.remote ||
    job.location.toLowerCase().includes(normalizedLocation);
  return queryMatches && locationMatches;
}

// ---------- Route handlers ----------

async function handleAuthRoute(path: string, method: string, body: Record<string, unknown>): Promise<unknown> {
  if (path === "/api/auth/register" && method === "POST") {
    const displayName = String(body.displayName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (displayName.length < 2 || displayName.length > 80) throw new DemoApiError("Enter a name between 2 and 80 characters");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DemoApiError("Enter a valid email address");
    if (password.length < 8 || password.length > 128) throw new DemoApiError("Password must be between 8 and 128 characters");
    const users = readUsers();
    if (users.some((user) => user.email === email)) throw new DemoApiError("An account with this email already exists", 409);
    const salt = randomSalt();
    const user: DemoUser = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      displayName,
      email,
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
      profile: {},
    };
    users.push(user);
    writeUsers(users);
    return { token: createSession(user.id), user: publicUser(user), profile: user.profile };
  }

  if (path === "/api/auth/login" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = readUsers().find((item) => item.email === email);
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      throw new DemoApiError("Email or password is incorrect", 401);
    }
    return { token: createSession(user.id), user: publicUser(user), profile: user.profile };
  }

  if (path === "/api/auth/me" && method === "GET") {
    const user = requireUser();
    return { user: publicUser(user), profile: user.profile || {} };
  }

  throw new DemoApiError("Not found", 404);
}

function handleProfileRoute(path: string, method: string, body: Record<string, unknown>): unknown {
  const user = requireUser();
  if (path === "/api/candidate/profile" && method === "GET") {
    return { profile: user.profile || {} };
  }
  if (path === "/api/candidate/profile" && method === "PATCH") {
    const updates = body?.profile as Record<string, unknown> | undefined;
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      throw new DemoApiError("Profile updates must be an object");
    }
    const entries = Object.entries(updates);
    if (!entries.length || entries.some(([key]) => !profileFields.has(key))) {
      throw new DemoApiError("Profile contains an unsupported field");
    }
    if (typeof updates.resumeText === "string" && updates.resumeText.length > 15000) {
      throw new DemoApiError("Resume text cannot exceed 15,000 characters");
    }
    if (updates.savedJobs !== undefined) {
      if (!Array.isArray(updates.savedJobs) || updates.savedJobs.length > 200) {
        throw new DemoApiError("Saved jobs must be an array containing at most 200 items");
      }
      const validStatuses = new Set(["saved", "applied", "interview", "offer", "rejected", "withdrawn"]);
      const savedJobs = updates.savedJobs as Array<Record<string, unknown>>;
      if (savedJobs.some((job) => !job || typeof job.id !== "string" || typeof job.title !== "string" ||
        typeof job.url !== "string" || !validStatuses.has(String(job.status)) || (job.notes && String(job.notes).length > 4000))) {
        throw new DemoApiError("A saved job has invalid fields");
      }
    }
    if (updates.jobFitAnalyses !== undefined && (!updates.jobFitAnalyses ||
      typeof updates.jobFitAnalyses !== "object" || Array.isArray(updates.jobFitAnalyses) ||
      Object.keys(updates.jobFitAnalyses).length > 200)) {
      throw new DemoApiError("Job fit analyses must be an object with at most 200 items");
    }
    const updated = updateUser(user.id, (record) => {
      record.profile = { ...(record.profile || {}), ...updates };
    });
    return { profile: updated.profile };
  }
  throw new DemoApiError("Not found", 404);
}

async function handleAiRoute(path: string, method: string, body: Record<string, unknown>): Promise<unknown> {
  const user = requireUser();

  if (path === "/api/ai/analyze-resume" && method === "POST") {
    const resumeText = typeof body?.resumeText === "string" ? body.resumeText : "";
    if (resumeText.trim().length < 30) throw new DemoApiError("Resume text is too short or missing");
    return withAi(
      async () => {
        const result = await groqJson(
          "You are an expert ATS scanner and career counselor. Analyze honestly and return only JSON with summary, atsScore (0-100), atsBreakdown (category/score/feedback), skills, experienceLevel, careerPaths (role/match/reason), foundKeywords, missingKeywords, strengths, improvements, and rewriteSuggestions (original/improved). Give 3 career paths, 8-15 missing keywords, 5+ improvements, and 3 rewrite suggestions.",
          `Analyze this resume:\n\n${resumeText.slice(0, 15000)}`,
          { temperature: 0.3, maxTokens: 3000 },
        );
        return {
          summary: result.summary || "",
          atsScore: Number(result.atsScore) || 0,
          atsBreakdown: objectArray(result.atsBreakdown).map((item) => ({
            category: String(item.category || ""),
            score: Number(item.score) || 0,
            feedback: String(item.feedback || ""),
          })),
          skills: stringArray(result.skills),
          experienceLevel: result.experienceLevel || "Not specified",
          careerPaths: objectArray(result.careerPaths).map((item) => ({
            role: String(item.role || "Career track"),
            match: Number(item.match) || 0,
            reason: String(item.reason || ""),
          })),
          foundKeywords: stringArray(result.foundKeywords),
          missingKeywords: stringArray(result.missingKeywords),
          strengths: stringArray(result.strengths),
          improvements: stringArray(result.improvements),
          rewriteSuggestions: objectArray(result.rewriteSuggestions).map((item) => ({
            original: String(item.original || ""),
            improved: String(item.improved || ""),
          })),
        };
      },
      () => offlineResumeAnalysis(resumeText),
    );
  }

  if (path === "/api/ai/generate-roadmap" && method === "POST") {
    const domain = String(body?.domain || "");
    const learningGoal = String(body?.learningGoal || "");
    const availableHours = body?.availableHours === undefined || body?.availableHours === null ? "" : String(body.availableHours);
    if (!domain || !learningGoal) throw new DemoApiError("Domain and learning goal are required");
    const data = await withAi(
      () => groqJson(
        "You are an expert career coach. Return JSON containing roadmap.phases (phase, duration, topics, resources), roadmap.milestones, dailySchedule.totalHours, dailySchedule.schedule (time, activity, duration, description), dailySchedule.weeklyGoals, and recommendations.",
        `Create a learning roadmap. Domain: ${domain}\nLearning Goal: ${learningGoal}\nAvailable hours per day: ${availableHours || "Not specified"}`,
        { temperature: 0.7, maxTokens: 2000 },
      ),
      () => offlineRoadmap(domain, learningGoal, availableHours),
    );
    return { success: true, data };
  }

  if (path === "/api/ai/generate-mindmap" && method === "POST") {
    const domain = String(body?.domain || "");
    const learningGoal = String(body?.learningGoal || "");
    if (!domain || !learningGoal) throw new DemoApiError("Domain and learning goal are required");
    const mindmap = await withAi(
      async () => {
        const result = await groqJson(
          "You are an expert learning advisor. Return JSON with nodes [{id,label,category,level}] and edges [{from,to}]. Create one central level-0 node, 4-6 level-1 branches, 3-5 level-2 topics per branch, concise labels, and valid unique IDs. Aim for 20-35 nodes.",
          `Create a learning mindmap for ${domain}. Learning goal: ${learningGoal}. Show fundamentals through advanced concepts.`,
          { temperature: 0.7, maxTokens: 3000 },
        );
        if (!Array.isArray(result.nodes) || !Array.isArray(result.edges)) throw new Error("AI returned an invalid mindmap");
        return result;
      },
      () => offlineMindmap(domain, learningGoal),
    );
    return { success: true, mindmap };
  }

  if (path === "/api/ai/generate-interview-questions" && method === "POST") {
    const role = String(body?.role || "");
    const focus = String(body?.focus || "");
    if (!role) throw new DemoApiError("Job role is required");
    const questions = await withAi<NormalizedQuestion[]>(
      async () => {
        const focusPrompt = focus === "hr"
          ? "Generate 7-8 behavioral questions and make question 1 a realistic multi-constraint workplace case study."
          : "Generate 5-6 role-specific technical questions, mixing concepts and practical problem solving.";
        const systemPrompt = `You are an expert interviewer. ${focusPrompt} Return exactly one JSON object with a top-level questions array. Every array item must have id (number), question (non-empty string), category (string), difficulty (Easy, Medium, or Hard), expectedPoints (array of strings), and timeLimit (string). Do not use alternate property names, markdown, or prose. Example: {"questions":[{"id":1,"question":"Explain a design decision you made.","category":"Technical","difficulty":"Medium","expectedPoints":["Trade-offs","Reasoning"],"timeLimit":"3-5 minutes"}]}`;
        const userPrompt = `Create ${focus === "hr" ? "8 HR" : "6 technical"} interview questions for the ${role} role. Focus area: ${focus || "general technical concepts"}. Ensure each question is specific to this role.`;
        let output = await groqJson(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 2048 });
        let list = normalizeQuestions(output, focus);
        if (!list.length) {
          output = await groqJson(
            "Return only a JSON object with one top-level key named questions. Its value must be an array of objects containing id, question, category, difficulty, expectedPoints (array), and timeLimit. Do not include any other keys or prose.",
            `${userPrompt}\nThe previous response did not contain the required questions array. Generate a corrected response now.`,
            { temperature: 0.2, maxTokens: 2048 },
          );
          list = normalizeQuestions(output, focus);
        }
        if (!list.length) {
          throw new DemoApiError("Groq did not return interview questions in the required format. Please try again.", 502);
        }
        return list;
      },
      () => offlineInterviewQuestions(role, focus).questions,
    );
    return { questions };
  }

  if (path === "/api/ai/evaluate-answer" && method === "POST") {
    const question = String(body?.question || "");
    const answer = String(body?.answer || "");
    const expectedPoints = Array.isArray(body?.expectedPoints) ? body.expectedPoints.map((point) => String(point)) : null;
    if (!question || !answer || !expectedPoints) {
      throw new DemoApiError("Question, answer, and expected points are required");
    }
    return withAi(
      async () => {
        const evaluation = await groqJson(
          "You are an expert interviewer. Evaluate the answer constructively, including a score from 0-100, strengths, improvements, detailed feedback, coveredPoints, and missedPoints. Return only JSON.",
          `Question: ${question}\nExpected points: ${expectedPoints.join(", ")}\nCandidate answer: ${answer}`,
          { temperature: 0.3, maxTokens: 1024 },
        );
        return {
          ...evaluation,
          score: Number(evaluation.score) || 0,
          strengths: stringArray(evaluation.strengths),
          improvements: stringArray(evaluation.improvements),
          feedback: typeof evaluation.feedback === "string" ? evaluation.feedback : "",
        };
      },
      () => offlineEvaluateAnswer(question, answer, expectedPoints),
    );
  }

  if (path === "/api/ai/job-fit" && method === "POST") {
    const job = body?.job as Record<string, unknown> | undefined;
    if (!job || typeof job !== "object" || Array.isArray(job) || typeof job.title !== "string" || !job.title.trim()) {
      throw new DemoApiError("A job title is required for fit analysis");
    }
    const profile = (user.profile || {}) as Record<string, unknown>;
    const resumeText = typeof profile.resumeText === "string" ? profile.resumeText.slice(0, 8000) : "";
    const careerAnalysis = profile.careerAnalysis && typeof profile.careerAnalysis === "object"
      ? profile.careerAnalysis as Record<string, unknown>
      : {};
    const skillLevels = profile.skillLevels && typeof profile.skillLevels === "object"
      ? Object.values(profile.skillLevels as Record<string, unknown>).flatMap((skills) => Array.isArray(skills) ? skills : [])
      : [];
    const candidateSkills = [...new Set([
      ...stringArray(careerAnalysis.skills),
      ...skillLevels
        .filter((skill) => skill && typeof (skill as { name?: unknown }).name === "string" && Number((skill as { current?: unknown }).current) > 0)
        .map((skill) => `${(skill as { name: string }).name} (${(skill as { current: number }).current}%)`),
    ])].slice(0, 60);
    if (!resumeText && !candidateSkills.length) {
      throw new DemoApiError("Add your resume or assess your skills before asking for a job fit analysis");
    }
    return withAi(
      async () => {
        const result = await groqJson(
          "You are a careful career-fit analyst. Compare the candidate's evidence with the job listing. Do not invent qualifications. Return only JSON with fitScore (integer 0-100), summary (one short paragraph), strengths (string array), skillGaps (string array), and nextSteps (string array). If information is missing, say so and reflect that uncertainty in the score.",
          `Candidate resume excerpt:\n${resumeText || "Not provided"}\n\nCandidate assessed skills:\n${candidateSkills.join(", ") || "Not provided"}\n\nJob listing:\n${JSON.stringify({
            title: job.title.slice(0, 200),
            company: String(job.company || "").slice(0, 120),
            location: String(job.location || "").slice(0, 120),
            tags: stringArray(job.tags).slice(0, 30),
            description: String(job.description || job.summary || "").slice(0, 4000),
          })}`,
          { temperature: 0.2, maxTokens: 1200 },
        );
        return {
          fitScore: Math.max(0, Math.min(100, Math.round(Number(result.fitScore) || 0))),
          summary: typeof result.summary === "string" ? result.summary : "The available candidate and job details are limited.",
          strengths: stringArray(result.strengths),
          skillGaps: stringArray(result.skillGaps),
          nextSteps: stringArray(result.nextSteps),
        };
      },
      () => offlineJobFit({
        resumeText,
        candidateSkills,
        job: {
          title: job.title.slice(0, 200),
          company: String(job.company || ""),
          location: String(job.location || ""),
          tags: stringArray(job.tags),
          description: String(job.description || ""),
          summary: String(job.summary || ""),
        },
      }),
    );
  }

  throw new DemoApiError("Not found", 404);
}

async function handleJobsRoute(path: string, method: string, params: URLSearchParams): Promise<unknown> {
  requireUser();
  if (path === "/api/jobs/search" && method === "GET") {
    const query = (params.get("q") || "").trim().slice(0, 100);
    const location = (params.get("location") || "").trim().slice(0, 100);
    if (query.length < 2) throw new DemoApiError("Enter a role, skill, or career domain to search");
    const feed = await getLiveJobFeeds();
    const now = Date.now();
    const jobs = feed.jobs
      .filter((job) => {
        const postedTime = Date.parse(job.postedAt || "");
        return Number.isFinite(postedTime) && now - postedTime <= recentJobWindowMs && jobMatches(job, query, location);
      })
      .sort((a, b) => Date.parse(b.postedAt || "") - Date.parse(a.postedAt || ""))
      .slice(0, 50);
    return { query, location, fetchedAt: feed.fetchedAt, sources: feed.sources, jobs };
  }
  throw new DemoApiError("Not found", 404);
}

// ---------- Entry point ----------

export async function handleLocalApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const url = new URL(`/api${path}`, window.location.origin);
  let body: Record<string, unknown> = {};
  if (typeof options.body === "string" && options.body) {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  try {
    if (url.pathname.startsWith("/api/auth/")) {
      return (await handleAuthRoute(url.pathname, method, body)) as T;
    }
    if (url.pathname.startsWith("/api/candidate/")) {
      return handleProfileRoute(url.pathname, method, body) as T;
    }
    if (url.pathname.startsWith("/api/ai/")) {
      return (await handleAiRoute(url.pathname, method, body)) as T;
    }
    if (url.pathname.startsWith("/api/jobs/")) {
      return (await handleJobsRoute(url.pathname, method, url.searchParams)) as T;
    }
    if (url.pathname === "/api/health") {
      return { status: "ok", database: "browser-demo" } as T;
    }
    throw new DemoApiError("Not found", 404);
  } catch (error) {
    const apiError = error instanceof DemoApiError ? error : new DemoApiError(error instanceof Error ? error.message : "Request failed", 500);
    if (apiError.status === 401 && !url.pathname.startsWith("/api/auth/login") && !url.pathname.startsWith("/api/auth/register")) {
      localStorage.removeItem(sessionKey);
    }
    throw new Error(apiError.message);
  }
}

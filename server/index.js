import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const port = Number(process.env.PORT || 3001);
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/skillquest";
const jwtSecret = process.env.JWT_SECRET || "local-development-secret-change-before-deploy-32chars";
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

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    profile: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true },
);

const User = mongoose.model("Candidate", userSchema);
app.use(express.json({ limit: "1mb" }));

function publicUser(user) {
  return { id: user.id, displayName: user.displayName, email: user.email };
}
// Generate a JWT token for the user with a 7-day expiration
function createToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "7d" });
}
//check is database is connected before processing requests
function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "MongoDB is not connected" });
  }
  next();
}
// Middleware to require authentication via JWT
function requireAuth(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Sign in to continue" });
  try {
    req.candidateId = jwt.verify(token, jwtSecret).sub;
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}
// Health check endpoint to verify server and database status
app.get("/api/health", requireDatabase, (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.name });
});
// User registration endpoint
app.post("/api/auth/register", requireDatabase, async (req, res, next) => {
  try {
    const displayName = String(req.body.displayName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (displayName.length < 2 || displayName.length > 80) {
      return res.status(400).json({ error: "Enter a name between 2 and 80 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 8 and 128 characters" });
    }
    const user = await User.create({
      displayName,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: createToken(user), user: publicUser(user), profile: user.profile });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "An account with this email already exists" });
    next(error);
  }
});
// User login endpoint
app.post("/api/auth/login", requireDatabase, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }
    res.json({ token: createToken(user), user: publicUser(user), profile: user.profile });
  } catch (error) {
    next(error);
  }
});
// Endpoint to get the authenticated user's information
app.get("/api/auth/me", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.candidateId);
    if (!user) return res.status(401).json({ error: "Account not found" });
    res.json({ user: publicUser(user), profile: user.profile || {} });
  } catch (error) {
    next(error);
  }
});

app.get("/api/candidate/profile", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.candidateId).select("profile");
    if (!user) return res.status(404).json({ error: "Account not found" });
    res.json({ profile: user.profile || {} });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/candidate/profile", requireDatabase, requireAuth, async (req, res, next) => {
  try {
    const updates = req.body?.profile;
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({ error: "Profile updates must be an object" });
    }
    const entries = Object.entries(updates);
    if (!entries.length || entries.some(([key]) => !profileFields.has(key))) {
      return res.status(400).json({ error: "Profile contains an unsupported field" });
    }
    if (typeof updates.resumeText === "string" && updates.resumeText.length > 15000) {
      return res.status(400).json({ error: "Resume text cannot exceed 15,000 characters" });
    }
    if (updates.savedJobs !== undefined) {
      if (!Array.isArray(updates.savedJobs) || updates.savedJobs.length > 200) {
        return res.status(400).json({ error: "Saved jobs must be an array containing at most 200 items" });
      }
      const validStatuses = new Set(["saved", "applied", "interview", "offer", "rejected", "withdrawn"]);
      if (updates.savedJobs.some((job) => !job || typeof job.id !== "string" || typeof job.title !== "string" ||
        typeof job.url !== "string" || !validStatuses.has(job.status) || (job.notes && String(job.notes).length > 4000))) {
        return res.status(400).json({ error: "A saved job has invalid fields" });
      }
    }
    if (updates.jobFitAnalyses !== undefined && (!updates.jobFitAnalyses ||
      typeof updates.jobFitAnalyses !== "object" || Array.isArray(updates.jobFitAnalyses) ||
      Object.keys(updates.jobFitAnalyses).length > 200)) {
      return res.status(400).json({ error: "Job fit analyses must be an object with at most 200 items" });
    }
    const user = await User.findById(req.candidateId);
    if (!user) return res.status(404).json({ error: "Account not found" });
    user.profile = { ...(user.profile || {}), ...updates };
    await user.save();
    res.json({ profile: user.profile });
  } catch (error) {
    next(error);
  }
});
// AI and job feed utilities
const preferredModels = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
];
let modelCache;
// Fetch the best available Groq model, preferring certain models and avoiding others
async function getGroqModel(apiKey) {
  if (modelCache) return modelCache;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      const { data = [] } = await response.json();
      const available = data.map((item) => item.id);
      modelCache = preferredModels.find((model) => available.includes(model)) ||
        available.find((model) => !/whisper|guard|tts|playai|orpheus|compound|prompt/i.test(model));
    }
  } catch (error) {
    console.error("Could not list available Groq models:", error.message);
  }
  return modelCache || "llama-3.3-70b-versatile";
}
// Parse JSON from a string, cleaning up code fences and handling partial JSON
function parseJson(content) {
  const cleaned = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned invalid JSON");
  }
}
// Filter an array to include only objects, excluding nulls and arrays
function objectArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item))
    : [];
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function findQuestionArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["questions", "interviewQuestions", "items"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  for (const key of ["data", "result", "interview"]) {
    const nested = findQuestionArray(value[key]);
    if (nested.length) return nested;
  }
  const values = Object.values(value);
  return values.length && values.every((item) => item && typeof item === "object" && (item.question || item.prompt || item.text))
    ? values
    : [];
}

function normalizeQuestions(value, focus) {
  return findQuestionArray(value)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const question = [item.question, item.prompt, item.text].find((entry) => typeof entry === "string" && entry.trim());
      if (!question) return null;
      const expectedPoints = stringArray(item.expectedPoints || item.keyPoints || item.evaluationCriteria);
      return {
        id: Number.isInteger(Number(item.id)) && Number(item.id) > 0 ? Number(item.id) : index + 1,
        question: question.trim(),
        category: typeof item.category === "string" ? item.category : focus === "hr" ? "Behavioral" : "Technical",
        difficulty: typeof item.difficulty === "string" ? item.difficulty : "Medium",
        expectedPoints,
        timeLimit: typeof item.timeLimit === "string" ? item.timeLimit : focus === "hr" ? "5 minutes" : "3-5 minutes",
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}
// Job feed caching and filtering
const jobFeedCacheMs = 5 * 60 * 1000;
const recentJobWindowMs = 60 * 24 * 60 * 60 * 1000;
let jobFeedCache;
let jobFeedCacheTime = 0;
// Convert HTML content to plain text, removing scripts, styles, and tags
function plainText(value) {
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

function validJobUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeRemoteOkJob(job) {
  const url = validJobUrl(job.url || job.apply_url);
  if (!url || !job.position) return null;
  return {
    id: `remoteok-${job.id || job.slug || url}`,
    source: "RemoteOK",
    title: String(job.position),
    company: String(job.company || "Company not listed"),
    location: String(job.location || "Remote"),
    remote: true,
    postedAt: job.date || null,
    url,
    tags: stringArray(job.tags),
    summary: plainText(job.description).slice(0, 320),
  };
}

function normalizeArbeitnowJob(job) {
  const url = validJobUrl(job.url);
  if (!url || !job.title) return null;
  return {
    id: `arbeitnow-${job.slug || url}`,
    source: "Arbeitnow",
    title: String(job.title),
    company: String(job.company_name || "Company not listed"),
    location: String(job.location || (job.remote ? "Remote" : "Location not listed")),
    remote: Boolean(job.remote),
    postedAt: job.created_at || null,
    url,
    tags: stringArray(job.tags),
    summary: plainText(job.description).slice(0, 320),
  };
}
// Fetch job JSON data from a given URL with optional headers and a timeout
async function fetchJobJson(url, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Job source returned HTTP ${response.status}`);
  return response.json();
}

async function getLiveJobFeeds() {
  if (jobFeedCache && Date.now() - jobFeedCacheTime < jobFeedCacheMs) return jobFeedCache;

  const feeds = await Promise.allSettled([
    fetchJobJson("https://remoteok.com/api", {
      "User-Agent": "SkillQuestCareerNavigator/1.0 (job discovery; source attribution included)",
    }).then((payload) => ({
      name: "RemoteOK",
      jobs: Array.isArray(payload) ? payload.slice(1).map(normalizeRemoteOkJob).filter(Boolean) : [],
    })),
    fetchJobJson("https://www.arbeitnow.com/api/job-board-api").then((payload) => ({
      name: "Arbeitnow",
      jobs: Array.isArray(payload.data) ? payload.data.map(normalizeArbeitnowJob).filter(Boolean) : [],
    })),
  ]);

  const sources = feeds.map((result, index) => {
    const name = index === 0 ? "RemoteOK" : "Arbeitnow";
    if (result.status === "fulfilled") return { name, available: true, count: result.value.jobs.length };
    console.warn(`${name} job feed unavailable:`, result.reason?.message || "Unknown error");
    return { name, available: false, count: 0 };
  });
  const jobs = feeds.flatMap((result) => result.status === "fulfilled" ? result.value.jobs : []);
  if (!jobs.length) {
    const error = new Error("Live job feeds are temporarily unavailable. Try again shortly.");
    error.status = 503;
    throw error;
  }

  jobFeedCache = { jobs, sources, fetchedAt: new Date().toISOString() };
  jobFeedCacheTime = Date.now();
  return jobFeedCache;
}

function jobMatches(job, query, location) {
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
// Send a prompt to the Groq API and return the parsed JSON response
async function groqJson(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error("Configure GROQ_API_KEY in .env to use AI features");
    error.status = 503;
    throw error;
  }
  const body = {
    model: await getGroqModel(apiKey),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
    response_format: { type: "json_object" },
  };
  let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 400) {
    delete body.response_format;
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  if (!response.ok) {
    const error = new Error(response.status === 429 ? "Groq rate limit reached. Try again shortly." : "Groq request failed");
    error.status = response.status;
    throw error;
  }
  const result = await response.json();
  return parseJson(result.choices?.[0]?.message?.content);
}


// AI routes for resume analysis, roadmap generation, mindmap creation, interview question generation, and answer evaluation    
const aiRoutes = express.Router();
aiRoutes.use(requireDatabase, requireAuth);

aiRoutes.post("/analyze-resume", async (req, res, next) => {
  const resumeText = req.body?.resumeText;
  if (typeof resumeText !== "string" || resumeText.trim().length < 30) {
    return res.status(400).json({ error: "Resume text is too short or missing" });
  }
  try {
    const result = await groqJson(
      `You are an expert ATS scanner and career counselor. Analyze honestly and return only JSON with summary, atsScore (0-100), atsBreakdown (category/score/feedback), skills, experienceLevel, careerPaths (role/match/reason), foundKeywords, missingKeywords, strengths, improvements, and rewriteSuggestions (original/improved). Give 3 career paths, 8-15 missing keywords, 5+ improvements, and 3 rewrite suggestions.`,
      `Analyze this resume:\n\n${resumeText.slice(0, 15000)}`,
      { temperature: 0.3, maxTokens: 3000 },
    );
    res.json({
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
    });
  } catch (error) {
    next(error);
  }
});

aiRoutes.post("/generate-roadmap", async (req, res, next) => {
  const { domain, learningGoal, availableHours } = req.body || {};
  if (!domain || !learningGoal) return res.status(400).json({ error: "Domain and learning goal are required" });
  try {
    const data = await groqJson(
      `You are an expert career coach. Return JSON containing roadmap.phases (phase, duration, topics, resources), roadmap.milestones, dailySchedule.totalHours, dailySchedule.schedule (time, activity, duration, description), dailySchedule.weeklyGoals, and recommendations.`,
      `Create a learning roadmap. Domain: ${domain}\nLearning Goal: ${learningGoal}\nAvailable hours per day: ${availableHours || "Not specified"}`,
      { temperature: 0.7, maxTokens: 2000 },
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

aiRoutes.post("/generate-mindmap", async (req, res, next) => {
  const { domain, learningGoal } = req.body || {};
  if (!domain || !learningGoal) return res.status(400).json({ error: "Domain and learning goal are required" });
  try {
    const mindmap = await groqJson(
      `You are an expert learning advisor. Return JSON with nodes [{id,label,category,level}] and edges [{from,to}]. Create one central level-0 node, 4-6 level-1 branches, 3-5 level-2 topics per branch, concise labels, and valid unique IDs. Aim for 20-35 nodes.`,
      `Create a learning mindmap for ${domain}. Learning goal: ${learningGoal}. Show fundamentals through advanced concepts.`,
      { temperature: 0.7, maxTokens: 3000 },
    );
    if (!Array.isArray(mindmap.nodes) || !Array.isArray(mindmap.edges)) throw new Error("AI returned an invalid mindmap");
    res.json({ success: true, mindmap });
  } catch (error) {
    next(error);
  }
});

aiRoutes.post("/generate-interview-questions", async (req, res, next) => {
  const { role, focus } = req.body || {};
  if (!role) return res.status(400).json({ error: "Job role is required" });
  try {
    const focusPrompt = focus === "hr"
      ? "Generate 7-8 behavioral questions and make question 1 a realistic multi-constraint workplace case study."
      : "Generate 5-6 role-specific technical questions, mixing concepts and practical problem solving.";
    const systemPrompt = `You are an expert interviewer. ${focusPrompt} Return exactly one JSON object with a top-level questions array. Every array item must have id (number), question (non-empty string), category (string), difficulty (Easy, Medium, or Hard), expectedPoints (array of strings), and timeLimit (string). Do not use alternate property names, markdown, or prose. Example: {"questions":[{"id":1,"question":"Explain a design decision you made.","category":"Technical","difficulty":"Medium","expectedPoints":["Trade-offs","Reasoning"],"timeLimit":"3-5 minutes"}]}`;
    const userPrompt = `Create ${focus === "hr" ? "8 HR" : "6 technical"} interview questions for the ${role} role. Focus area: ${focus || "general technical concepts"}. Ensure each question is specific to this role.`;
    let output = await groqJson(
      systemPrompt,
      userPrompt,
      { temperature: 0.7, maxTokens: 2048 },
    );
    let questions = normalizeQuestions(output, focus);
    if (!questions.length) {
      output = await groqJson(
        `Return only a JSON object with one top-level key named questions. Its value must be an array of objects containing id, question, category, difficulty, expectedPoints (array), and timeLimit. Do not include any other keys or prose.`,
        `${userPrompt}\nThe previous response did not contain the required questions array. Generate a corrected response now.`,
        { temperature: 0.2, maxTokens: 2048 },
      );
      questions = normalizeQuestions(output, focus);
    }
    if (!questions.length) {
      const error = new Error("Groq did not return interview questions in the required format. Please try again.");
      error.status = 502;
      throw error;
    }
    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

aiRoutes.post("/evaluate-answer", async (req, res, next) => {
  const { question, answer, expectedPoints = [] } = req.body || {};
  if (!question || !answer || !Array.isArray(expectedPoints)) {
    return res.status(400).json({ error: "Question, answer, and expected points are required" });
  }
  try {
    const evaluation = await groqJson(
      `You are an expert interviewer. Evaluate the answer constructively, including a score from 0-100, strengths, improvements, detailed feedback, coveredPoints, and missedPoints. Return only JSON.`,
      `Question: ${question}\nExpected points: ${expectedPoints.join(", ")}\nCandidate answer: ${answer}`,
      { temperature: 0.3, maxTokens: 1024 },
    );
    res.json(evaluation);
  } catch (error) {
    next(error);
  }
});

aiRoutes.post("/job-fit", async (req, res, next) => {
  const job = req.body?.job;
  if (!job || typeof job !== "object" || typeof job.title !== "string" || !job.title.trim()) {
    return res.status(400).json({ error: "A job title is required for fit analysis" });
  }
  try {
    const candidate = await User.findById(req.candidateId).select("profile");
    if (!candidate) return res.status(404).json({ error: "Account not found" });

    const profile = candidate.profile || {};
    const resumeText = typeof profile.resumeText === "string" ? profile.resumeText.slice(0, 8000) : "";
    const careerAnalysis = profile.careerAnalysis && typeof profile.careerAnalysis === "object"
      ? profile.careerAnalysis
      : {};
    const skillLevels = profile.skillLevels && typeof profile.skillLevels === "object"
      ? Object.values(profile.skillLevels).flatMap((skills) => Array.isArray(skills) ? skills : [])
      : [];
    const candidateSkills = [...new Set([
      ...stringArray(careerAnalysis.skills),
      ...skillLevels.filter((skill) => skill && typeof skill.name === "string" && Number(skill.current) > 0)
        .map((skill) => `${skill.name} (${skill.current}%)`),
    ])].slice(0, 60);
    if (!resumeText && !candidateSkills.length) {
      return res.status(400).json({ error: "Add your resume or assess your skills before asking for a job fit analysis" });
    }

    const result = await groqJson(
      `You are a careful career-fit analyst. Compare the candidate's evidence with the job listing. Do not invent qualifications. Return only JSON with fitScore (integer 0-100), summary (one short paragraph), strengths (string array), skillGaps (string array), and nextSteps (string array). If information is missing, say so and reflect that uncertainty in the score.`,
      `Candidate resume excerpt:\n${resumeText || "Not provided"}\n\nCandidate assessed skills:\n${candidateSkills.join(", ") || "Not provided"}\n\nJob listing:\n${JSON.stringify({
        title: job.title.slice(0, 200),
        company: String(job.company || "").slice(0, 120),
        location: String(job.location || "").slice(0, 120),
        tags: stringArray(job.tags).slice(0, 30),
        description: String(job.description || job.summary || "").slice(0, 4000),
      })}`,
      { temperature: 0.2, maxTokens: 1200 },
    );
    res.json({
      fitScore: Math.max(0, Math.min(100, Math.round(Number(result.fitScore) || 0))),
      summary: typeof result.summary === "string" ? result.summary : "The available candidate and job details are limited.",
      strengths: stringArray(result.strengths),
      skillGaps: stringArray(result.skillGaps),
      nextSteps: stringArray(result.nextSteps),
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/ai", aiRoutes);

const jobsRouter = express.Router();
jobsRouter.use(requireDatabase, requireAuth);
jobsRouter.get("/search", async (req, res, next) => {
  const query = String(req.query.q || "").trim().slice(0, 100);
  const location = String(req.query.location || "").trim().slice(0, 100);
  if (query.length < 2) return res.status(400).json({ error: "Enter a role, skill, or career domain to search" });
  try {
    const feed = await getLiveJobFeeds();
    const now = Date.now();
    const jobs = feed.jobs
      .filter((job) => {
        const postedTime = Date.parse(job.postedAt || "");
        return Number.isFinite(postedTime) && now - postedTime <= recentJobWindowMs && jobMatches(job, query, location);
      })
      .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
      .slice(0, 50);
    res.json({ query, location, fetchedAt: feed.fetchedAt, sources: feed.sources, jobs });
  } catch (error) {
    next(error);
  }
});
app.use("/api/jobs", jobsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Internal server error" });
});

try {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production");
  }
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  app.listen(port, "127.0.0.1", () => console.log(`API listening on http://localhost:${port}`));
} catch (error) {
  console.error(`Could not connect to MongoDB at ${mongoUri}: ${error.message}`);
  process.exit(1);
}
// Deterministic offline AI engine for the static demo build. When no Groq key
// is configured (or Groq is unreachable), these generators produce solid,
// structured results that match the exact response shapes the UI expects, so
// every feature keeps working out of the box.

export interface ResumeAnalysisResult {
  summary: string;
  atsScore: number;
  atsBreakdown: Array<{ category: string; score: number; feedback: string }>;
  skills: string[];
  experienceLevel: string;
  careerPaths: Array<{ role: string; match: number; reason: string }>;
  foundKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  rewriteSuggestions: Array<{ original: string; improved: string }>;
}

export interface RoadmapResult {
  roadmap: { phases: Array<{ phase: string; duration: string; topics: string[]; resources: string[] }>; milestones: string[] };
  dailySchedule: { totalHours: string; schedule: Array<{ time: string; activity: string; duration: string; description: string }>; weeklyGoals: string[] };
  recommendations: string[];
}

export interface MindmapResult {
  nodes: Array<{ id: string; label: string; category: string; level: number }>;
  edges: Array<{ from: string; to: string }>;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  expectedPoints: string[];
  timeLimit: string;
}

export interface AnswerEvaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
  coveredPoints: string[];
  missedPoints: string[];
}

export interface JobFitResult {
  fitScore: number;
  summary: string;
  strengths: string[];
  skillGaps: string[];
  nextSteps: string[];
}

type ClusterKey = "frontend" | "backend" | "data" | "ml" | "devops" | "mobile" | "design" | "security" | "soft";

interface SkillEntry {
  name: string;
  cluster: ClusterKey;
  pattern?: RegExp;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function skillPattern(name: string, caseInsensitive = true): RegExp {
  const body = escapeRegex(name).replace(/\\?\s+/g, "[\\s-]*").replace(/\\\+/g, "\\+");
  const suffix = /[+#]$/.test(name) ? "(?:$|[^A-Za-z0-9+#])" : "(?:$|[^A-Za-z0-9+#])";
  return new RegExp(`(?:^|[^A-Za-z0-9])${body}${suffix}`, caseInsensitive ? "i" : "");
}

const entry = (name: string, cluster: ClusterKey, pattern?: RegExp): SkillEntry => ({
  name,
  cluster,
  pattern: pattern || skillPattern(name),
});

const SKILL_LIBRARY: SkillEntry[] = [
  // Frontend
  entry("HTML", "frontend"), entry("CSS", "frontend"), entry("JavaScript", "frontend"), entry("TypeScript", "frontend"),
  entry("React", "frontend"), entry("Next.js", "frontend"), entry("Vue.js", "frontend"), entry("Angular", "frontend"),
  entry("Svelte", "frontend"), entry("Redux", "frontend"), entry("Tailwind CSS", "frontend"), entry("Bootstrap", "frontend"),
  entry("Material UI", "frontend"), entry("Sass", "frontend"), entry("Webpack", "frontend"), entry("Vite", "frontend"),
  entry("Jest", "frontend"), entry("React Testing Library", "frontend"), entry("Cypress", "frontend"), entry("Playwright", "frontend"),
  entry("Responsive Design", "frontend"), entry("Accessibility", "frontend"), entry("Web Performance", "frontend"),
  entry("PWA", "frontend", skillPattern("PWA", false)), entry("WebSockets", "frontend"), entry("GraphQL", "frontend"),
  entry("Storybook", "frontend"), entry("Framer Motion", "frontend"), entry("Three.js", "frontend"), entry("WebGL", "frontend"),
  entry("SEO", "frontend", skillPattern("SEO", false)),
  // Backend
  entry("Node.js", "backend"), entry("Express.js", "backend"), entry("NestJS", "backend"), entry("Django", "backend"),
  entry("Flask", "backend"), entry("FastAPI", "backend"), entry("Ruby on Rails", "backend"), entry("Spring Boot", "backend"),
  entry("Laravel", "backend"), entry("PHP", "backend"), entry("Java", "backend"), entry("C#", "backend"), entry(".NET", "backend"),
  entry("Go", "backend", new RegExp("(?:^|[^A-Za-z0-9])Go(?:$|[^A-Za-z0-9])|golang", "i")), entry("Rust", "backend"),
  entry("Python", "backend"), entry("Ruby", "backend"), entry("REST API", "backend"), entry("gRPC", "backend"),
  entry("Microservices", "backend"), entry("RabbitMQ", "backend"), entry("Kafka", "backend"), entry("Redis", "backend"),
  entry("PostgreSQL", "backend"), entry("MySQL", "backend"), entry("MongoDB", "backend"), entry("SQL Server", "backend"),
  entry("DynamoDB", "backend"), entry("Cassandra", "backend"), entry("Elasticsearch", "backend"), entry("Prisma", "backend"),
  entry("Mongoose", "backend"), entry("OAuth", "backend"), entry("JWT", "backend", skillPattern("JWT", false)),
  entry("System Design", "backend"), entry("Caching", "backend"), entry("Nginx", "backend"), entry("API Design", "backend"),
  // Data
  entry("SQL", "data"), entry("Excel", "data"), entry("Power BI", "data"), entry("Tableau", "data"), entry("Looker", "data"),
  entry("Google Analytics", "data"), entry("Data Analysis", "data"), entry("Data Visualization", "data"), entry("Data Modeling", "data"),
  entry("ETL", "data", skillPattern("ETL", false)), entry("Data Warehousing", "data"), entry("BigQuery", "data"),
  entry("Snowflake", "data"), entry("Redshift", "data"), entry("Spark", "data"), entry("Hadoop", "data"), entry("Airflow", "data"),
  entry("dbt", "data"), entry("Pandas", "data"), entry("NumPy", "data"), entry("Statistics", "data"), entry("A/B Testing", "data"),
  entry("Data Mining", "data"), entry("Time Series", "data"), entry("Forecasting", "data"), entry("Data Cleaning", "data"),
  entry("Reporting", "data"),
  // ML / AI
  entry("Machine Learning", "ml"), entry("Deep Learning", "ml"), entry("TensorFlow", "ml"), entry("PyTorch", "ml"),
  entry("Keras", "ml"), entry("Scikit-learn", "ml"), entry("NLP", "ml", skillPattern("NLP", false)),
  entry("Computer Vision", "ml"), entry("LLM", "ml", skillPattern("LLM", false)), entry("Generative AI", "ml"),
  entry("Prompt Engineering", "ml"), entry("LangChain", "ml"), entry("Hugging Face", "ml"), entry("RAG", "ml", skillPattern("RAG", false)),
  entry("Fine-tuning", "ml"), entry("Model Deployment", "ml"), entry("Feature Engineering", "ml"),
  entry("Recommendation Systems", "ml"), entry("OpenCV", "ml"), entry("spaCy", "ml"), entry("Transformers", "ml"),
  entry("Vector Databases", "ml"), entry("Embeddings", "ml"),
  // DevOps / Cloud
  entry("AWS", "devops", skillPattern("AWS", false)), entry("Azure", "devops"), entry("GCP", "devops", skillPattern("GCP", false)),
  entry("Docker", "devops"), entry("Kubernetes", "devops"), entry("Terraform", "devops"), entry("Ansible", "devops"),
  entry("Jenkins", "devops"), entry("GitHub Actions", "devops"), entry("GitLab CI", "devops"), entry("CI/CD", "devops"),
  entry("Linux", "devops"), entry("Bash", "devops"), entry("Git", "devops"), entry("GitHub", "devops"),
  entry("Prometheus", "devops"), entry("Grafana", "devops"), entry("ELK Stack", "devops"), entry("Serverless", "devops"),
  entry("Lambda", "devops"), entry("DevOps", "devops"), entry("Monitoring", "devops"), entry("Load Balancing", "devops"),
  entry("Helm", "devops"), entry("MLOps", "devops"),
  // Mobile
  entry("Android", "mobile"), entry("iOS", "mobile"), entry("React Native", "mobile"), entry("Flutter", "mobile"),
  entry("Swift", "mobile"), entry("Kotlin", "mobile"), entry("Dart", "mobile"), entry("Jetpack Compose", "mobile"),
  entry("SwiftUI", "mobile"), entry("Firebase", "mobile"), entry("Expo", "mobile"), entry("Mobile UI", "mobile"),
  // Design
  entry("Figma", "design"), entry("Sketch", "design"), entry("Adobe XD", "design"), entry("Photoshop", "design"),
  entry("Illustrator", "design"), entry("UI Design", "design"), entry("UX Design", "design"), entry("Wireframing", "design"),
  entry("Prototyping", "design"), entry("Design Systems", "design"), entry("User Research", "design"),
  entry("Usability Testing", "design"), entry("Interaction Design", "design"), entry("Typography", "design"),
  entry("Motion Design", "design"), entry("Canva", "design"),
  // Security
  entry("Cybersecurity", "security"), entry("Penetration Testing", "security"), entry("Network Security", "security"),
  entry("Cryptography", "security"), entry("OWASP", "security", skillPattern("OWASP", false)), entry("SIEM", "security", skillPattern("SIEM", false)),
  entry("Incident Response", "security"), entry("Firewalls", "security"), entry("Vulnerability Assessment", "security"),
  entry("Threat Modeling", "security"), entry("Burp Suite", "security"), entry("Wireshark", "security"), entry("Kali Linux", "security"),
  entry("ISO 27001", "security"), entry("Zero Trust", "security"),
  // Soft skills
  entry("Communication", "soft"), entry("Leadership", "soft"), entry("Teamwork", "soft"), entry("Problem Solving", "soft"),
  entry("Time Management", "soft"), entry("Adaptability", "soft"), entry("Collaboration", "soft"), entry("Public Speaking", "soft"),
  entry("Mentoring", "soft"), entry("Agile", "soft"), entry("Scrum", "soft"), entry("Kanban", "soft"),
  entry("Project Management", "soft"), entry("Critical Thinking", "soft"), entry("Presentation", "soft"),
  entry("Stakeholder Management", "soft"), entry("Documentation", "soft"),
];

const CLUSTER_CAREERS: Record<ClusterKey, string[]> = {
  frontend: ["Frontend Developer (React)", "Full Stack Engineer", "UI Engineer"],
  backend: ["Backend Developer (Node.js)", "Full Stack Engineer", "Platform Engineer"],
  data: ["Data Analyst", "Business Intelligence Analyst", "Analytics Engineer"],
  ml: ["Machine Learning Engineer", "AI/GenAI Engineer", "Data Scientist"],
  devops: ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer"],
  mobile: ["Mobile App Developer", "Android Developer", "iOS Developer"],
  design: ["UI/UX Designer", "Product Designer", "Interaction Designer"],
  security: ["Security Analyst", "Penetration Tester", "Security Engineer"],
  soft: ["Associate Software Engineer", "Business Analyst", "Project Coordinator"],
};

const CLUSTER_LABELS: Record<ClusterKey, string> = {
  frontend: "frontend development",
  backend: "backend development",
  data: "data & analytics",
  ml: "AI & machine learning",
  devops: "cloud & DevOps",
  mobile: "mobile development",
  design: "product design",
  security: "cybersecurity",
  soft: "general professional skills",
};

interface Archetype {
  key: string;
  matcher: RegExp;
  label: string;
  branches: Array<{ label: string; topics: string[] }>;
  resources: string[];
  keywords: string[];
  technical: Array<{ question: string; difficulty: string; expectedPoints: string[] }>;
}

const ARCHETYPES: Archetype[] = [
  {
    key: "webdev",
    matcher: /react|frontend|front-end|web dev|full.?stack|javascript|typescript|vue|angular|next\.?js|mern|html|css/i,
    label: "Web Development",
    branches: [
      { label: "Web Foundations", topics: ["HTML5 semantics", "Modern CSS layout (Flexbox, Grid)", "JavaScript ES6+ essentials", "Git & version control workflow"] },
      { label: "Frontend Frameworks", topics: ["{domain} component architecture", "State management patterns", "Routing and data fetching", "Forms and validation"] },
      { label: "Backend & APIs", topics: ["REST API design", "Authentication and sessions", "Database modeling", "Error handling and validation"] },
      { label: "Quality & Testing", topics: ["Unit testing fundamentals", "Integration and E2E testing", "Debugging in the browser and DevTools", "Accessibility basics (WCAG)"] },
      { label: "Production Readiness", topics: ["Build tooling and bundling", "Performance optimization", "Deployment pipelines", "Monitoring and error tracking"] },
    ],
    resources: [
      "MDN Web Docs (developer.mozilla.org)",
      "The Odin Project full-stack curriculum",
      "React official documentation (react.dev)",
      "freeCodeCamp Responsive Web Design & JS certifications",
      "Frontend Masters / Epic React courses",
      "Build and deploy 3 portfolio projects on GitHub",
    ],
    keywords: ["REST APIs", "TypeScript", "Responsive Design", "Web Performance", "Testing (Jest)", "CI/CD", "Accessibility", "State Management", "Component Design", "Version Control", "Agile", "Debugging", "Deployment", "SEO basics", "Web Security", "Database Design", "API Integration", "Code Review", "Documentation", "Performance Budgets"],
    technical: [
      { question: "Explain the difference between client-side and server-side rendering, and when you would choose each for a {role} project.", difficulty: "Medium", expectedPoints: ["Time to first paint", "SEO implications", "Server load", "Use case trade-offs"] },
      { question: "How do you manage state in a large {domain} application? Compare at least two approaches.", difficulty: "Medium", expectedPoints: ["Global vs local state", "State libraries", "Server cache state", "Scalability concerns"] },
      { question: "Walk through how you would debug a page that loads slowly in production.", difficulty: "Hard", expectedPoints: ["Measuring with DevTools/Lighthouse", "Network waterfall analysis", "Bundle analysis", "Fixing render-blocking resources"] },
      { question: "How would you secure a web application against the OWASP Top 10?", difficulty: "Hard", expectedPoints: ["Input validation", "XSS and CSRF defenses", "Authentication best practices", "Dependency management"] },
      { question: "Describe how you would design the data flow between a React frontend and a REST backend for a feature like user notifications.", difficulty: "Medium", expectedPoints: ["API contract", "Loading and error states", "Caching strategy", "Real-time vs polling"] },
      { question: "What does 'responsive design' mean in practice, and how do you test it across devices?", difficulty: "Easy", expectedPoints: ["Fluid layouts", "Breakpoints", "Testing tools", "Touch targets and accessibility"] },
    ],
  },
  {
    key: "backend",
    matcher: /backend|back-end|node|express|django|flask|spring|api|microservice|server|java\b|php|ruby|golang|\bgo\b/i,
    label: "Backend Engineering",
    branches: [
      { label: "Language & Runtime", topics: ["Core language fundamentals", "Async patterns and concurrency", "Package management", "Error handling strategy"] },
      { label: "APIs & Services", topics: ["REST and GraphQL API design", "Authentication & authorization", "Rate limiting and validation", "API versioning"] },
      { label: "Databases", topics: ["Relational modeling & SQL", "Indexes and query optimization", "NoSQL trade-offs", "Transactions and consistency"] },
      { label: "Reliability", topics: ["Logging and observability", "Caching layers", "Background jobs & queues", "Handling failures gracefully"] },
      { label: "Scalability", topics: ["Horizontal scaling patterns", "Load balancing", "Message queues", "Containerized deployment"] },
    ],
    resources: [
      "Designing Data-Intensive Applications (Kleppmann)",
      "Node.js / Django / Spring official guides",
      "PostgreSQL official tutorial",
      "System Design Primer (GitHub)",
      "Build a production-grade REST API with tests",
      "Roadmap.sh backend developer path",
    ],
    keywords: ["Microservices", "Docker", "PostgreSQL", "Redis", "Message Queues", "System Design", "Unit Testing", "API Security", "Caching", "Load Balancing", "Observability", "Database Indexing", "CI/CD", "Cloud Deployment", "Concurrency", "Rate Limiting", "Authentication (JWT/OAuth)", "Horizontal Scaling", "Monitoring", "Documentation"],
    technical: [
      { question: "How would you design the database schema and API for a {domain} booking system with concurrent users?", difficulty: "Hard", expectedPoints: ["Schema and relations", "Race conditions", "Transaction isolation", "Indexing strategy"] },
      { question: "Explain how JWT authentication works and its main security trade-offs compared to server sessions.", difficulty: "Medium", expectedPoints: ["Token structure", "Stateless verification", "Revocation challenges", "Storage best practices"] },
      { question: "A production endpoint becomes slow under load. Walk through your investigation.", difficulty: "Hard", expectedPoints: ["Metrics and tracing", "Query analysis", "Caching", "Scaling decisions"] },
      { question: "What is idempotency and why does it matter for payment or order APIs?", difficulty: "Medium", expectedPoints: ["Retry safety", "Idempotency keys", "At-least-once delivery", "Consistency guarantees"] },
      { question: "Compare SQL and NoSQL databases for a {domain} application and justify a choice.", difficulty: "Medium", expectedPoints: ["Data shape", "Consistency needs", "Query patterns", "Operational trade-offs"] },
      { question: "How do you structure error handling and logging so that failures are debuggable in production?", difficulty: "Easy", expectedPoints: ["Structured logs", "Correlation IDs", "Error taxonomy", "Alerting thresholds"] },
    ],
  },
  {
    key: "data",
    matcher: /data (analyst|analysis|scientist|engineering|warehouse)|sql|power bi|tableau|analytics|etl|bi\b|business intelligence/i,
    label: "Data & Analytics",
    branches: [
      { label: "Data Foundations", topics: ["SQL from basics to window functions", "Spreadsheet modeling", "Data types and cleaning", "Descriptive statistics"] },
      { label: "Analysis & Visualization", topics: ["Exploratory data analysis", "Dashboard design principles", "Power BI / Tableau report building", "Storytelling with charts"] },
      { label: "Data Pipelines", topics: ["ETL vs ELT concepts", "Scheduling and orchestration", "Data quality checks", "Working with APIs and files"] },
      { label: "Advanced Analytics", topics: ["A/B testing and experimentation", "Cohort and funnel analysis", "Forecasting basics", "Causal vs correlational thinking"] },
      { label: "Business Impact", topics: ["Defining metrics and KPIs", "Stakeholder requirements gathering", "Presenting findings to leadership", "Documentation and data governance"] },
    ],
    resources: [
      "Mode Analytics SQL Tutorial",
      "Kaggle Learn micro-courses",
      "Storytelling with Data (Cole Nussbaumer Knaflic)",
      "Power BI / Tableau official learning paths",
      "Google Data Analytics Certificate",
      "Build 3 end-to-end portfolio dashboards",
    ],
    keywords: ["SQL", "Python for data", "Power BI", "Tableau", "Excel modeling", "ETL", "Data Warehousing", "A/B Testing", "Cohort Analysis", "Dashboarding", "Data Storytelling", "Statistics", "BigQuery/Snowflake", "dbt", "Airflow", "Data Quality", "KPIs", "Stakeholder Management", "Forecasting", "Data Governance"],
    technical: [
      { question: "Write the approach for finding the top customer cohort by retention in a {domain} dataset.", difficulty: "Hard", expectedPoints: ["Cohort definition", "SQL window functions", "Retention curve", "Interpretation"] },
      { question: "How would you design a dashboard for a {role} stakeholder group?", difficulty: "Medium", expectedPoints: ["Audience and KPIs", "Hierarchy of metrics", "Interactivity", "Refresh cadence"] },
      { question: "Explain the difference between correlation and causation with a business example.", difficulty: "Medium", expectedPoints: ["Confounding variables", "Experiments", "Observational limits", "Decision impact"] },
      { question: "A key metric dropped 20% week-over-week. Walk through your investigation steps.", difficulty: "Hard", expectedPoints: ["Segment breakdown", "Data quality check", "External factors", "Hypothesis testing"] },
      { question: "How do you ensure data quality in a pipeline you own?", difficulty: "Medium", expectedPoints: ["Validation tests", "Freshness checks", "Alerting", "Lineage documentation"] },
      { question: "Describe an experiment you would run to test a new feature's impact.", difficulty: "Easy", expectedPoints: ["Hypothesis", "Control group", "Success metric", "Sample size considerations"] },
    ],
  },
  {
    key: "ml",
    matcher: /machine learning|deep learning|\bml\b|\bai\b|nlp|computer vision|llm|genai|generative|data scientist|pytorch|tensorflow/i,
    label: "AI & Machine Learning",
    branches: [
      { label: "Math & Python Foundations", topics: ["Linear algebra and calculus intuition", "Probability and statistics", "Python for ML (NumPy, Pandas)", "Data preprocessing workflows"] },
      { label: "Classical Machine Learning", topics: ["Supervised learning algorithms", "Model evaluation and metrics", "Feature engineering", "Cross-validation and bias-variance"] },
      { label: "Deep Learning", topics: ["Neural network fundamentals", "CNNs and RNNs", "Transformers and attention", "Transfer learning"] },
      { label: "Modern AI/LLM Systems", topics: ["Prompt engineering", "RAG pipelines", "Fine-tuning and evaluation", "Vector databases and embeddings"] },
      { label: "Deployment & MLOps", topics: ["Model serving APIs", "Monitoring and drift detection", "Experiment tracking", "CI/CD for models"] },
    ],
    resources: [
      "fast.ai Practical Deep Learning for Coders",
      "Andrew Ng Machine Learning Specialization",
      "Hugging Face NLP & LLM courses",
      "DeepLearning.AI short courses",
      "Hands-On Machine Learning (Géron)",
      "Build and deploy 3 ML/LLM projects end-to-end",
    ],
    keywords: ["PyTorch", "TensorFlow", "Scikit-learn", "Feature Engineering", "Model Evaluation", "NLP", "Computer Vision", "LangChain", "RAG", "Prompt Engineering", "Vector Databases", "Fine-tuning", "MLOps", "Model Deployment", "Experiment Tracking", "Drift Monitoring", "Data Preprocessing", "Transformers", "Embeddings", "Evaluation Metrics"],
    technical: [
      { question: "How would you design an ML pipeline for a {domain} prediction problem from data collection to deployment?", difficulty: "Hard", expectedPoints: ["Problem framing", "Data collection & splits", "Model selection", "Deployment & monitoring"] },
      { question: "Explain overfitting and three techniques you use to prevent it.", difficulty: "Medium", expectedPoints: ["Definition", "Regularization", "Cross-validation", "More data / early stopping"] },
      { question: "When would you choose a classical ML model over a deep learning model?", difficulty: "Medium", expectedPoints: ["Data size", "Interpretability", "Compute cost", "Time to production"] },
      { question: "Describe how a RAG system works and where it can fail.", difficulty: "Hard", expectedPoints: ["Retrieval + generation", "Chunking strategy", "Embedding quality", "Hallucination mitigation"] },
      { question: "How do you evaluate a model beyond accuracy?", difficulty: "Medium", expectedPoints: ["Precision/recall/F1", "Confusion matrix", "Business-aligned metrics", "Class imbalance"] },
      { question: "What would you monitor after deploying a model to production?", difficulty: "Easy", expectedPoints: ["Input drift", "Prediction distribution", "Latency", "Business KPIs"] },
    ],
  },
  {
    key: "devops",
    matcher: /devops|sre|cloud|kubernetes|docker|aws|azure|gcp|infrastructure|platform engineer|terraform/i,
    label: "Cloud & DevOps",
    branches: [
      { label: "Linux & Networking", topics: ["Linux command line mastery", "Networking fundamentals (DNS, TCP/IP)", "Shell scripting", "Process and resource management"] },
      { label: "Containers & Orchestration", topics: ["Docker image building", "Docker Compose workflows", "Kubernetes core objects", "Helm packaging basics"] },
      { label: "Cloud Platforms", topics: ["Core cloud services (compute, storage, network)", "IAM and security groups", "Infrastructure as Code (Terraform)", "Cost awareness"] },
      { label: "CI/CD & Automation", topics: ["Pipeline design", "GitHub Actions / GitLab CI", "Automated testing gates", "Release strategies"] },
      { label: "Observability & Reliability", topics: ["Metrics, logs, traces", "Prometheus and Grafana", "Alerting and on-call basics", "Incident response"] },
    ],
    resources: [
      "AWS / Azure / GCP official certification paths",
      "Kubernetes documentation tutorials",
      "Docker Deep Dive (Nigel Poulton)",
      "Terraform Up & Running",
      "Katacoda-style hands-on labs",
      "Build a full CI/CD pipeline for a sample app",
    ],
    keywords: ["Docker", "Kubernetes", "Terraform", "AWS", "CI/CD", "GitHub Actions", "Prometheus", "Grafana", "Linux", "Bash scripting", "Ansible", "Load Balancing", "Monitoring", "Incident Response", "IaC", "Serverless", "Networking", "Security Groups", "Cost Optimization", "Blue-Green Deployment"],
    technical: [
      { question: "Walk through how you would containerize and deploy a {domain} application to the cloud with zero downtime.", difficulty: "Hard", expectedPoints: ["Dockerfile best practices", "Registry and pipeline", "Rolling/blue-green deploy", "Health checks"] },
      { question: "Explain Kubernetes pod, deployment, and service resources and how they relate.", difficulty: "Medium", expectedPoints: ["Pod lifecycle", "Replica management", "Service discovery", "Scaling"] },
      { question: "How do you manage secrets across environments in CI/CD?", difficulty: "Medium", expectedPoints: ["Secret managers", "Environment separation", "Rotation", "Least privilege"] },
      { question: "A service is up but users report slowness. How do you diagnose it?", difficulty: "Hard", expectedPoints: ["Dashboards and metrics", "Resource saturation", "Dependency latency", "Tracing"] },
      { question: "What is Infrastructure as Code and why is it important for a {role}?", difficulty: "Easy", expectedPoints: ["Reproducibility", "Review process", "Drift detection", "Disaster recovery"] },
      { question: "Describe your rollback strategy when a deployment causes errors.", difficulty: "Medium", expectedPoints: ["Automated rollback triggers", "Versioning", "Database migrations", "Post-mortem process"] },
    ],
  },
  {
    key: "mobile",
    matcher: /android|ios|mobile|flutter|react native|swift|kotlin|app develop/i,
    label: "Mobile Development",
    branches: [
      { label: "Platform Foundations", topics: ["Mobile app lifecycle", "UI layout systems", "Navigation patterns", "Permissions model"] },
      { label: "UI Development", topics: ["{domain} screen composition", "State management", "Theming and dark mode", "Animations and gestures"] },
      { label: "Data & Networking", topics: ["REST/GraphQL integration", "Local storage (SQLite, preferences)", "Offline-first patterns", "Push notifications"] },
      { label: "Quality", topics: ["Unit and widget testing", "Device/emulator testing", "Performance profiling", "Crash reporting"] },
      { label: "Release Engineering", topics: ["App signing and store setup", "Beta tracks (TestFlight, Play Console)", "Store listing optimization", "Staged rollouts"] },
    ],
    resources: [
      "Android Developers official codelabs",
      "Apple SwiftUI tutorials",
      "Flutter official documentation & cookbook",
      "React Native docs and community templates",
      "Build and publish a real app to a store",
      "Mobile performance best-practices guides",
    ],
    keywords: ["Kotlin", "Swift", "Flutter", "React Native", "Jetpack Compose", "SwiftUI", "REST APIs", "Local Database", "Push Notifications", "Play Store", "App Store", "Mobile UI", "State Management", "Testing", "Performance Profiling", "Offline Support", "Material Design", "Human Interface Guidelines", "CI/CD", "Crash Analytics"],
    technical: [
      { question: "How would you structure a new {domain} mobile app's architecture for testability and growth?", difficulty: "Hard", expectedPoints: ["Layer separation", "State management choice", "Dependency injection", "Testing strategy"] },
      { question: "Explain how you would implement offline support with sync for a {role} app.", difficulty: "Hard", expectedPoints: ["Local cache", "Conflict resolution", "Sync queue", "Network detection"] },
      { question: "How do you handle different screen sizes and orientations?", difficulty: "Medium", expectedPoints: ["Responsive layouts", "Resource qualifiers", "Safe areas", "Testing matrix"] },
      { question: "What is the activity/fragment or view lifecycle and why does it matter?", difficulty: "Medium", expectedPoints: ["Lifecycle callbacks", "Configuration changes", "Memory leaks", "Data survival"] },
      { question: "Describe your process for reducing app size and startup time.", difficulty: "Medium", expectedPoints: ["Profiling tools", "Lazy initialization", "Asset optimization", "Code shrinking"] },
      { question: "How would you set up automated testing and CI for a mobile app?", difficulty: "Easy", expectedPoints: ["Unit vs instrumented tests", "Device farms", "Pipeline stages", "Release signing"] },
    ],
  },
  {
    key: "design",
    matcher: /design|figma|ui\/ux|\bux\b|\bui\b|product design|user experience/i,
    label: "Product Design",
    branches: [
      { label: "Design Foundations", topics: ["Visual hierarchy", "Color and typography systems", "Spacing and layout grids", "Design principles & heuristics"] },
      { label: "UX Research", topics: ["User interviews", "Personas and journey maps", "Usability testing", "Competitive analysis"] },
      { label: "Interaction Design", topics: ["Wireframing to high-fidelity", "Prototyping in Figma", "Micro-interactions", "Accessibility in design"] },
      { label: "Design Systems", topics: ["Component libraries", "Tokens and theming", "Documentation practices", "Handoff to developers"] },
      { label: "Portfolio & Collaboration", topics: ["Case study storytelling", "Design critique", "Working with product & engineering", "Measuring design impact"] },
    ],
    resources: [
      "Refactoring UI (Wathan & Schoger)",
      "Figma official tutorial series",
      "Nielsen Norman Group articles",
      "Laws of UX (lawsofux.com)",
      "Google UX Design Certificate",
      "Publish 3 end-to-end case studies in your portfolio",
    ],
    keywords: ["Figma", "Wireframing", "Prototyping", "User Research", "Usability Testing", "Design Systems", "Interaction Design", "Typography", "Color Theory", "Accessibility", "Information Architecture", "Responsive Design", "Design Tokens", "Handoff", "Personas", "Journey Mapping", "A/B Testing", "Visual Hierarchy", "Portfolio", "Stakeholder Presentation"],
    technical: [
      { question: "Walk through your design process for a {domain} feature from problem to handoff.", difficulty: "Hard", expectedPoints: ["Problem framing", "Research", "Iteration", "Developer handoff"] },
      { question: "How do you decide between following an existing design system and creating something custom?", difficulty: "Medium", expectedPoints: ["Consistency value", "Cost of divergence", "Brand needs", "Maintenance"] },
      { question: "How would you improve the usability of a {role} screen you find confusing?", difficulty: "Medium", expectedPoints: ["Heuristic evaluation", "User testing", "Prioritization", "Measurable outcome"] },
      { question: "Explain how accessibility influences your design decisions.", difficulty: "Medium", expectedPoints: ["Contrast ratios", "Keyboard navigation", "Screen readers", "Inclusive language"] },
      { question: "How do you measure whether a design change was successful?", difficulty: "Medium", expectedPoints: ["Task success rate", "Time on task", "Conversion metrics", "Qualitative feedback"] },
      { question: "Describe a time you received difficult design feedback and how you handled it.", difficulty: "Easy", expectedPoints: ["Active listening", "Separating ego", "Data-driven decision", "Outcome"] },
    ],
  },
  {
    key: "security",
    matcher: /security|cyber|pentest|penetration|\bsoc\b|infosec|ethical hack/i,
    label: "Cybersecurity",
    branches: [
      { label: "Security Foundations", topics: ["CIA triad and risk", "Networking for security", "Operating system hardening", "Cryptography basics"] },
      { label: "Offensive Security", topics: ["Reconnaissance techniques", "Vulnerability scanning", "Web exploitation (OWASP)", "Reporting findings"] },
      { label: "Defensive Security", topics: ["SIEM and log analysis", "Intrusion detection", "Incident response playbooks", "Threat hunting basics"] },
      { label: "Governance & Compliance", topics: ["ISO 27001 / NIST frameworks", "Risk assessment", "Policy writing", "Audit preparation"] },
      { label: "Career & Labs", topics: ["Home lab setup", "CTF practice", "Certifications roadmap (Security+, OSCP)", "Bug bounty basics"] },
    ],
    resources: [
      "TryHackMe & Hack The Box learning paths",
      "OWASP Top 10 documentation",
      "Professor Messer Security+ course",
      "Blue Team Labs Online",
      "CompTIA Security+ / CEH study guides",
      "Document 3 lab/CTF write-ups for your portfolio",
    ],
    keywords: ["Penetration Testing", "OWASP Top 10", "SIEM", "Incident Response", "Network Security", "Vulnerability Assessment", "Threat Modeling", "Cryptography", "Risk Assessment", "ISO 27001", "NIST", "Firewalls", "IDS/IPS", "Log Analysis", "Burp Suite", "Wireshark", "Linux Hardening", "Security Awareness", "Zero Trust", "Compliance"],
    technical: [
      { question: "Walk through how you would perform a penetration test against a {domain} web application.", difficulty: "Hard", expectedPoints: ["Scoping & rules of engagement", "Recon", "Exploitation", "Reporting & remediation"] },
      { question: "Explain the OWASP Top 10 and pick two vulnerabilities you have hands-on experience with.", difficulty: "Medium", expectedPoints: ["Injection", "Broken access control", "Mitigations", "Real examples"] },
      { question: "How would you detect and respond to a suspected breach on a corporate network?", difficulty: "Hard", expectedPoints: ["Triage & containment", "Evidence preservation", "Eradication", "Lessons learned"] },
      { question: "What is the difference between symmetric and asymmetric encryption, and where is each used?", difficulty: "Medium", expectedPoints: ["Key distribution", "Performance", "TLS example", "Signing vs encryption"] },
      { question: "How do you prioritize vulnerabilities for remediation in a {role} environment?", difficulty: "Medium", expectedPoints: ["CVSS and exploitability", "Business criticality", "Compensating controls", "Timeline SLAs"] },
      { question: "Describe how you keep your security skills current.", difficulty: "Easy", expectedPoints: ["CTFs & labs", "Advisories", "Community", "Certifications"] },
    ],
  },
  {
    key: "blockchain",
    matcher: /blockchain|web3|solidity|smart contract|crypto|defi|ethereum/i,
    label: "Blockchain & Web3",
    branches: [
      { label: "Blockchain Foundations", topics: ["How blockchains reach consensus", "Wallets, keys, and addresses", "Public vs private chains", "Gas and transaction lifecycle"] },
      { label: "Smart Contracts", topics: ["Solidity syntax and patterns", "Contract security pitfalls", "Testing with Hardhat/Foundry", "Upgradeability patterns"] },
      { label: "DApp Development", topics: ["Connecting wallets (ethers.js)", "Reading and writing contract state", "Indexing events", "Frontend integration"] },
      { label: "DeFi & Tokens", topics: ["ERC-20 / ERC-721 standards", "DeFi primitives", "Oracles", "Tokenomics basics"] },
      { label: "Security & Auditing", topics: ["Common exploit classes", "Static analysis tools", "On-chain monitoring", "Audit report reading"] },
    ],
    resources: [
      "CryptoZombies interactive Solidity course",
      "Ethereum developer documentation",
      "Foundry / Hardhat tutorials",
      "Ethernaut security challenges",
      "Build and deploy a DApp on a testnet",
      "Read 3 real audit reports end-to-end",
    ],
    keywords: ["Solidity", "Ethereum", "Smart Contracts", "Hardhat", "Foundry", "Ethers.js", "ERC-20", "ERC-721", "Gas Optimization", "Reentrancy", "Oracles", "Web3.js", "Testnets", "IPFS", "Tokenomics", "Auditing", "Wallet Integration", "Consensus", "Security Patterns", "DeFi"],
    technical: [
      { question: "Explain how you would design and secure a smart contract for a {domain} use case.", difficulty: "Hard", expectedPoints: ["State design", "Access control", "Reentrancy protection", "Testing & audit"] },
      { question: "What is a reentrancy attack and how do you prevent it?", difficulty: "Medium", expectedPoints: ["External calls", "Checks-effects-interactions", "Reentrancy guards", "Real incidents"] },
      { question: "How do gas costs influence your contract design?", difficulty: "Medium", expectedPoints: ["Storage costs", "Packing variables", "Events vs storage", "Batching"] },
      { question: "Describe how a DApp frontend connects to a smart contract.", difficulty: "Medium", expectedPoints: ["Wallet connection", "ABI usage", "Transaction signing", "Network handling"] },
      { question: "What are the trade-offs between on-chain and off-chain data storage?", difficulty: "Hard", expectedPoints: ["Cost", "Privacy", "Trust model", "IPFS hashing"] },
      { question: "How would you test a smart contract before mainnet deployment?", difficulty: "Easy", expectedPoints: ["Unit tests", "Fuzzing", "Testnet deploy", "Audit checklist"] },
    ],
  },
];

const GENERIC_ARCHETYPE: Archetype = {
  key: "generic",
  matcher: /.*/,
  label: "Career Development",
  branches: [
    { label: "Foundations", topics: ["Core concepts of {domain}", "Essential tools and setup", "Terminology and mental models", "Study plan and resources"] },
    { label: "Core Skills", topics: ["Daily practice routine", "Fundamental techniques", "Common patterns and pitfalls", "Beginner project"] },
    { label: "Applied Practice", topics: ["Intermediate project work", "Problem-solving frameworks", "Working with feedback", "Collaboration basics"] },
    { label: "Portfolio & Proof", topics: ["Building showcase projects", "Documenting your work", "Writing case studies", "Peer review"] },
    { label: "Career Launch", topics: ["Resume and profile optimization", "Interview preparation", "Networking strategy", "Job search execution"] },
  ],
  resources: [
    "Roadmap.sh learning paths",
    "freeCodeCamp & Coursera foundations",
    "YouTube: 2-3 trusted educators in {domain}",
    "Build 3 progressively harder projects",
    "Join a community (Discord / local meetup)",
    "Document progress publicly (GitHub / blog)",
  ],
  keywords: ["Communication", "Problem Solving", "Project Work", "Documentation", "Teamwork", "Time Management", "Portfolio", "Version Control", "Presentation", "Continuous Learning", "Networking", "Interview Preparation", "Case Studies", "Feedback", "Agile", "Critical Thinking", "Adaptability", "Research", "Planning", "Execution"],
  technical: [
    { question: "Describe a challenging project related to {domain} and how you approached it.", difficulty: "Medium", expectedPoints: ["Problem context", "Your approach", "Obstacles", "Result & learning"] },
    { question: "How do you stay current in {domain} and structure your learning?", difficulty: "Easy", expectedPoints: ["Sources", "Practice routine", "Community", "Applied projects"] },
    { question: "Walk through a decision you made with incomplete information.", difficulty: "Medium", expectedPoints: ["Constraints", "Assumptions", "Trade-offs", "Outcome review"] },
    { question: "How would you prioritize tasks if given more work than time available?", difficulty: "Medium", expectedPoints: ["Impact vs effort", "Stakeholder communication", "Delegation", "Focus blocks"] },
    { question: "Give an example of receiving critical feedback and how you improved.", difficulty: "Easy", expectedPoints: ["Listening", "Action taken", "Measurable improvement", "Attitude"] },
    { question: "What would you do in your first 30 days in the {role} role?", difficulty: "Medium", expectedPoints: ["Learning plan", "Relationship building", "Quick wins", "Asking questions"] },
  ],
};

function pickArchetype(text: string): Archetype {
  return ARCHETYPES.find((archetype) => archetype.matcher.test(text)) || GENERIC_ARCHETYPE;
}

const expand = (value: string, domain: string, goal: string) =>
  value.replace(/\{domain\}/g, domain || "your field").replace(/\{goal\}/g, goal || "your goal");

// ---------- Resume analysis ----------

function findSkills(text: string): SkillEntry[] {
  const lower = text.toLowerCase();
  return SKILL_LIBRARY.filter((skill) => {
    if (skill.name === "Go") return skill.pattern?.test(text) || lower.includes("golang");
    return (skill.pattern || skillPattern(skill.name)).test(text);
  });
}

function detectExperience(text: string): string {
  const years = [...text.matchAll(/(\d{1,2})\+?\s*(?:years|yrs)\b/gi)].map((match) => Number(match[1]));
  const maxYears = years.length ? Math.max(...years) : 0;
  if (maxYears >= 6) return "Senior level (6+ years)";
  if (maxYears >= 3) return "Mid level (3-5 years)";
  if (maxYears >= 1) return "Early career (1-3 years)";
  if (/intern(ship)?\b|fresher|entry[- ]level|graduate/i.test(text)) return "Entry level (0-2 years)";
  const hasWorkWords = /experience|worked|developed|built|designed|led|managed/i.test(text);
  return hasWorkWords ? "Early career (1-3 years)" : "Student / Aspiring professional";
}

export function offlineResumeAnalysis(resumeText: string): ResumeAnalysisResult {
  const text = resumeText.slice(0, 15000);
  const lower = text.toLowerCase();
  const found = findSkills(text);
  const foundNames = found.map((skill) => skill.name);
  const archetype = pickArchetype(text);

  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(text);
  const hasLink = /linkedin\.com|github\.com|portfolio|https?:\/\//i.test(text);
  const bulletCount = (text.match(/^[\s]*[•▪◦\-*]/gm) || []).length;
  const sectionCount = ["experience", "education", "project", "skills", "summary"].filter((section) => lower.includes(section)).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const numbersWithImpact = (text.match(/\b\d+(\.\d+)?\s*(%|percent|k\b|m\b|users|customers|hours|days|weeks|months)/gi) || []).length;
  const actionVerbs = ["built", "led", "designed", "developed", "implemented", "launched", "optimized", "created", "managed", "delivered", "improved", "automated"]
    .filter((verb) => new RegExp(`\\b${verb}`, "i").test(text));

  const contactScore = Math.min(100, 50 + (hasEmail ? 20 : 0) + (hasPhone ? 10 : 0) + (hasLink ? 20 : 0));
  const keywordScore = Math.min(100, 38 + found.length * 6);
  const formattingScore = Math.min(100, 45 + (bulletCount >= 5 ? 15 : 0) + sectionCount * 8 + (wordCount >= 250 && wordCount <= 1100 ? 12 : 0));
  const quantifiedScore = Math.min(100, 38 + Math.min(numbersWithImpact, 5) * 9 + (/(increased|reduced|improved|saved|grew|accelerated)/i.test(text) ? 10 : 0));
  const verbsScore = Math.min(100, 40 + actionVerbs.length * 6);
  const lengthScore = wordCount < 120 ? 50 : wordCount < 250 ? 68 : wordCount <= 1100 ? 90 : 70;

  const breakdownDefs: Array<{ category: string; score: number; feedback: string }> = [
    {
      category: "Contact Information",
      score: Math.round(contactScore),
      feedback: !hasEmail || !hasPhone
        ? "Add a professional email and phone number at the top so recruiters and ATS parsers can reach you instantly."
        : hasLink
          ? "Contact block is complete with email, phone, and professional links."
          : "Contact details are present; add a LinkedIn or GitHub link to strengthen credibility.",
    },
    {
      category: "Keywords & Skills",
      score: Math.round(keywordScore),
      feedback: found.length >= 12
        ? `Strong keyword coverage with ${found.length} recognized skills relevant to modern roles.`
        : `Only ${found.length} recognized skills were detected. Mirror the exact keywords from target job descriptions (see suggestions below).`,
    },
    {
      category: "Formatting & Structure",
      score: Math.round(formattingScore),
      feedback: sectionCount >= 4 && bulletCount >= 5
        ? "Clear sections and bullet points give the resume a clean, ATS-friendly structure."
        : "Use standard section headings (Experience, Education, Projects, Skills) and start each item with a bullet point.",
    },
    {
      category: "Quantified Achievements",
      score: Math.round(quantifiedScore),
      feedback: numbersWithImpact >= 3
        ? "Good use of measurable outcomes; this is what makes achievements believable."
        : "Add measurable outcomes (%, numbers, time saved, users impacted) to your strongest achievements.",
    },
    {
      category: "Action Verbs",
      score: Math.round(verbsScore),
      feedback: actionVerbs.length >= 6
        ? "Strong, varied action verbs lead your bullet points."
        : "Replace passive phrasing (\"responsible for\", \"worked on\") with strong verbs like Built, Led, Automated, Optimized.",
    },
    {
      category: "Length & Readability",
      score: Math.round(lengthScore),
      feedback: wordCount < 250
        ? "The resume is quite short. Expand projects and impact statements to fill roughly one page."
        : wordCount > 1100
          ? "The resume is long. Tighten older roles and keep only the strongest points per position."
          : "Length is in the ideal range for a focused one-to-two-page resume.",
    },
  ];
  const atsScore = Math.max(35, Math.min(95, Math.round(breakdownDefs.reduce((sum, item) => sum + item.score, 0) / breakdownDefs.length)));

  const clusterCounts = new Map<ClusterKey, number>();
  for (const skill of found) clusterCounts.set(skill.cluster, (clusterCounts.get(skill.cluster) || 0) + 1);
  clusterCounts.delete("soft");
  const rankedClusters = [...clusterCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const topClusters = rankedClusters.length ? rankedClusters.slice(0, 3) : [["frontend", 0] as [ClusterKey, number]];

  const careerPaths = topClusters.map(([cluster, count], index) => ({
    role: CLUSTER_CAREERS[cluster][Math.min(index, CLUSTER_CAREERS[cluster].length - 1)],
    match: Math.max(45, Math.min(96, 46 + count * 8 + (index === 0 ? 6 : 0))),
    reason: count
      ? `Your resume shows ${count} ${CLUSTER_LABELS[cluster]} skill${count === 1 ? "" : "s"} (${found.filter((skill) => skill.cluster === cluster).slice(0, 4).map((skill) => skill.name).join(", ")}), which maps directly to this path.`
      : `Your background is broad, so this ${CLUSTER_LABELS[cluster]} path is a strong place to focus next.`,
  }));

  const pool = [...archetype.keywords, ...ARCHETYPES.find((item) => item.key === "webdev")!.keywords];
  const missingKeywords = [...new Set(pool)]
    .filter((keyword) => !foundNames.some((name) => name.toLowerCase() === keyword.toLowerCase()) && !lower.includes(keyword.toLowerCase().split(" ")[0]))
    .slice(0, 12);
  while (missingKeywords.length < 8) {
    const filler = ["Problem Solving", "Agile", "Documentation", "Unit Testing"].find((item) => !missingKeywords.includes(item) && !lower.includes(item.toLowerCase()));
    if (!filler) break;
    missingKeywords.push(filler);
  }

  const topSkills = found.slice(0, 6).map((skill) => skill.name);
  const strengths = [
    topSkills.length ? `Detected ${found.length} relevant skills, led by ${topSkills.slice(0, 3).join(", ")}.` : "The resume highlights transferable experience worth building on.",
    hasEmail && hasPhone ? "Contact information is complete and easy for recruiters to find." : "The document is easy to scan at a glance.",
    numbersWithImpact >= 3 ? `Includes ${numbersWithImpact} quantified results, which recruiters weigh heavily.` : "Projects and roles are listed clearly, giving a good base to expand.",
    actionVerbs.length >= 4 ? `Uses active phrasing such as ${actionVerbs.slice(0, 3).join(", ")}.` : "The resume structure makes your day-to-day responsibilities visible.",
    `Strongest alignment is with ${CLUSTER_LABELS[topClusters[0][0]]} roles.`,
  ];
  const improvements = [
    missingKeywords.length ? `Add target keywords naturally in your bullets: ${missingKeywords.slice(0, 6).join(", ")}.` : "Tailor keywords to each job description before applying.",
    numbersWithImpact < 3 ? "Quantify your top five bullet points with numbers, percentages, or time saved." : "Keep each quantified result tied to a clear business outcome.",
    actionVerbs.length < 6 ? "Start every bullet with a strong action verb and cut phrases like \"responsible for\"." : "Vary your action verbs so repeated words don't dilute the impact.",
    hasLink ? "Make sure your GitHub/portfolio links are clickable and lead to polished work." : "Add a GitHub or portfolio link so reviewers can see your work directly.",
    "Write a 2-3 line professional summary at the top targeted to the exact role you're applying for.",
    "Keep formatting ATS-safe: single column, no tables or text inside images, standard fonts.",
  ];

  const weakLines = text.split(/\n+/).map((line) => line.trim()).filter((line) =>
    line.length > 25 && line.length < 160 && /responsible for|worked on|helped (with|to)|was part of|assisted (in|with)|involved in|tasked with/i.test(line)).slice(0, 3);
  const verbUpgrades: Array<[RegExp, string]> = [
    [/responsible for/i, "Owned"],
    [/worked on/i, "Built"],
    [/helped (with|to)/i, "Drove"],
    [/was part of/i, "Contributed to"],
    [/assisted (in|with)/i, "Supported delivery of"],
    [/involved in/i, "Drove"],
    [/tasked with/i, "Led"],
  ];
  const rewriteSuggestions = weakLines.map((line) => {
    let improved = line;
    for (const [pattern, replacement] of verbUpgrades) {
      if (pattern.test(improved)) {
        improved = improved.replace(pattern, replacement);
        break;
      }
    }
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    if (!/\d/.test(improved)) improved += " — add a measurable result (%, time saved, users impacted).";
    return { original: line.slice(0, 220), improved: improved.slice(0, 240) };
  });
  if (rewriteSuggestions.length < 3) {
    const fallbacks = [
      {
        original: "Responsible for managing the project and coordinating with the team.",
        improved: "Led a cross-functional team of 5 to deliver the project 2 weeks ahead of schedule, cutting delivery risk by 30%.",
      },
      {
        original: "Worked on improving the website performance.",
        improved: "Optimized page load time by 45% (4.2s → 2.3s) by code-splitting bundles and caching static assets.",
      },
      {
        original: "Helped with testing and bug fixing.",
        improved: "Automated regression tests covering 80% of critical flows, reducing production bugs by 35% quarter-over-quarter.",
      },
    ];
    for (const fallback of fallbacks) {
      if (rewriteSuggestions.length >= 3) break;
      if (!rewriteSuggestions.some((item) => item.improved === fallback.improved)) rewriteSuggestions.push(fallback);
    }
  }

  const experienceLevel = detectExperience(text);
  const summary = `${experienceLevel} profile with ${found.length ? `${found.length} detected skills including ${topSkills.slice(0, 3).join(", ")}` : "a developing skill set"}. ${atsScore >= 75 ? "The resume is already ATS-friendly" : atsScore >= 60 ? "The resume is reasonably structured but needs keyword and impact tuning" : "The resume needs structural and keyword improvements to pass ATS filters"}. Best fit: ${careerPaths[0].role}.`;

  return {
    summary,
    atsScore,
    atsBreakdown: breakdownDefs,
    skills: foundNames.slice(0, 24),
    experienceLevel,
    careerPaths,
    foundKeywords: foundNames.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 15),
    strengths: strengths.slice(0, 6),
    improvements: improvements.slice(0, 7),
    rewriteSuggestions: rewriteSuggestions.slice(0, 3),
  };
}

// ---------- Roadmap ----------

function formatTime(minutesFromMidnight: number): string {
  const total = ((minutesFromMidnight % 1440) + 1440) % 1440;
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function offlineRoadmap(domain: string, learningGoal: string, availableHours: string): RoadmapResult {
  const archetype = pickArchetype(`${domain} ${learningGoal}`);
  const parsedHours = Number.parseFloat(availableHours);
  const hours = Number.isFinite(parsedHours) && parsedHours > 0 ? Math.min(Math.max(parsedHours, 1), 12) : 3;
  const speed = Math.max(0.5, Math.min(2, 3 / hours));
  const baseWeeks = [3, 3, 4, 3, 3];

  const phases = archetype.branches.map((branch, index) => ({
    phase: `${index + 1}. ${branch.label}`,
    duration: `${Math.max(1, Math.round(baseWeeks[index] * speed))} weeks`,
    topics: branch.topics.map((topic) => expand(topic, domain, learningGoal)),
    resources: [
      expand(archetype.resources[index % archetype.resources.length], domain, learningGoal),
      expand(archetype.resources[(index + 3) % archetype.resources.length], domain, learningGoal),
    ],
  }));

  const totalMinutes = Math.round(hours * 60);
  const slotsDef = [
    { activity: "Concept learning", pct: 0.35, description: "Study the current phase topics with focused reading and videos." },
    { activity: "Hands-on practice", pct: 0.35, description: "Apply the concepts with exercises, katas, or small builds." },
    { activity: "Project work", pct: 0.2, description: `Push forward your ${domain || "portfolio"} project and commit progress.` },
    { activity: "Revision & notes", pct: 0.1, description: "Review what you learned and write short notes or flashcards." },
  ];
  let cursor = 18 * 60;
  const schedule = slotsDef.map((slot) => {
    const duration = Math.max(10, Math.round(totalMinutes * slot.pct));
    const start = formatTime(cursor);
    const end = formatTime(cursor + duration);
    cursor += duration + 5;
    return {
      time: `${start} – ${end}`,
      activity: slot.activity,
      duration: `${duration} min`,
      description: slot.description,
    };
  });

  const milestones = [
    `Finish-phase milestone: complete all ${archetype.branches[0].label.toLowerCase()} topics with a small demo.`,
    `Build one portfolio project applying phase 2 concepts end-to-end.`,
    `Pass a self-assessment quiz at 80%+ on intermediate topics.`,
    `Ship a capstone project for ${domain || "your domain"} and publish the code publicly.`,
    `Complete 3 mock interviews or peer reviews and incorporate the feedback.`,
    `Update resume and portfolio with the new ${domain || "domain"} projects.`,
  ];

  const weeklyGoals = [
    `Complete the current phase's topics and mark them off in the Skill Roadmap.`,
    `Spend at least ${Math.max(1, Math.round(hours * 4))} focused hours per week on hands-on practice.`,
    `Commit code or share work publicly at least 3 times this week.`,
    `Write one short learning summary or notes page per topic.`,
    "Review previous week's material for 30 minutes before starting new content.",
  ];

  const recommendations = [
    `Block a fixed daily slot (${schedule[0].time.split(" – ")[0]}) and protect it like a meeting — consistency beats intensity.`,
    `Follow the 70/30 rule: 70% building, 30% consuming content so skills stick.`,
    `Join a community around ${domain || "your field"} and ask one question or share one update weekly.`,
    "Track progress in the dashboard so momentum stays visible.",
    `Align ${learningGoal || "your goal"} with 1-2 concrete portfolio projects employers can verify.`,
    hours < 2 ? "With limited daily time, prioritize the Project work block — outcomes matter more than coverage." : "You have enough daily time to add a weekly deep-dive session on the hardest topic.",
  ];

  return {
    roadmap: { phases, milestones },
    dailySchedule: { totalHours: `${hours} hour${hours === 1 ? "" : "s"}/day`, schedule, weeklyGoals },
    recommendations,
  };
}

// ---------- Mindmap ----------

export function offlineMindmap(domain: string, learningGoal: string): MindmapResult {
  const archetype = pickArchetype(`${domain} ${learningGoal}`);
  const rootLabel = (domain || "Learning Path").trim().slice(0, 40);
  const nodes: MindmapResult["nodes"] = [{ id: "root", label: rootLabel, category: "Goal", level: 0 }];
  const edges: MindmapResult["edges"] = [];
  archetype.branches.forEach((branch, branchIndex) => {
    const branchId = `b${branchIndex}`;
    nodes.push({ id: branchId, label: branch.label, category: "Core Area", level: 1 });
    edges.push({ from: "root", to: branchId });
    branch.topics.slice(0, 4).forEach((topic, topicIndex) => {
      const topicId = `b${branchIndex}-t${topicIndex}`;
      nodes.push({ id: topicId, label: expand(topic, domain, learningGoal).slice(0, 48), category: branch.label, level: 2 });
      edges.push({ from: branchId, to: topicId });
    });
  });
  return { nodes, edges };
}

// ---------- Interview questions ----------

export function offlineInterviewQuestions(role: string, focus: string): { questions: InterviewQuestion[] } {
  const roleLabel = role.trim().slice(0, 80) || "the target role";
  if (focus === "hr") {
    const questions: InterviewQuestion[] = [
      {
        id: 1,
        question: `Case study: You are the newest member of a team that is behind schedule on a critical deliverable. You have 3 weeks left, the requirements changed last week, one teammate is on leave, and stakeholders are asking for daily updates. Walk through exactly how you would handle the next 72 hours — what you prioritize, what you communicate, and what trade-offs you make.`,
        category: "Case Study",
        difficulty: "Hard",
        expectedPoints: ["Situation assessment and prioritization", "Stakeholder communication plan", "Scope trade-off decisions", "Team workload and morale handling"],
        timeLimit: "8 minutes",
      },
      {
        id: 2,
        question: `Tell me about yourself and why you are pursuing the ${roleLabel} role.`,
        category: "Behavioral",
        difficulty: "Easy",
        expectedPoints: ["Concise professional summary", "Relevant motivation", "Connection to the role", "Future direction"],
        timeLimit: "5 minutes",
      },
      {
        id: 3,
        question: "Describe a time you worked in a team where a member was not contributing. What did you do?",
        category: "Behavioral",
        difficulty: "Medium",
        expectedPoints: ["Empathy and direct conversation", "Escalation judgment", "Outcome", "Learning"],
        timeLimit: "5 minutes",
      },
      {
        id: 4,
        question: "Give an example of a time you received difficult feedback. How did you respond and what changed?",
        category: "Behavioral",
        difficulty: "Medium",
        expectedPoints: ["Non-defensive listening", "Concrete action taken", "Measurable improvement", "Attitude toward growth"],
        timeLimit: "5 minutes",
      },
      {
        id: 5,
        question: "Tell me about a time you had to learn something completely new under a tight deadline.",
        category: "Behavioral",
        difficulty: "Medium",
        expectedPoints: ["Learning strategy", "Prioritization under pressure", "Support seeking", "Result"],
        timeLimit: "5 minutes",
      },
      {
        id: 6,
        question: "Describe a situation where you disagreed with a decision made by your manager or team. How did you handle it?",
        category: "Behavioral",
        difficulty: "Hard",
        expectedPoints: ["Respectful challenge", "Evidence-based argument", "Commitment after decision", "Relationship preservation"],
        timeLimit: "5 minutes",
      },
      {
        id: 7,
        question: "Where do you see yourself in three years, and how does this role fit into that plan?",
        category: "Behavioral",
        difficulty: "Easy",
        expectedPoints: ["Realistic ambition", "Alignment with role", "Growth mindset", "Commitment signal"],
        timeLimit: "5 minutes",
      },
      {
        id: 8,
        question: "Tell me about a mistake you made that had real consequences. What did you learn?",
        category: "Behavioral",
        difficulty: "Hard",
        expectedPoints: ["Ownership without excuses", "Root cause analysis", "Corrective action", "Prevention systems"],
        timeLimit: "5 minutes",
      },
    ];
    return { questions };
  }

  const archetype = pickArchetype(`${role} ${focus}`);
  const questions: InterviewQuestion[] = archetype.technical.map((item, index) => ({
    id: index + 1,
    question: expand(item.question, role.trim() || archetype.label, ""),
    category: "Technical",
    difficulty: item.difficulty,
    expectedPoints: item.expectedPoints,
    timeLimit: "3-5 minutes",
  }));
  return { questions };
}

// ---------- Answer evaluation ----------

const stopWords = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "your", "their", "about", "have", "will", "would", "using", "used", "one", "two", "how", "why", "what", "when", "which", "are", "was", "were", "can", "could", "should", "than", "then", "them", "they"]);

const normalizeToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#]/g, "").trim();

function pointCoverage(expectedPoints: string[], answer: string): { covered: string[]; missed: string[] } {
  const answerTokens = new Set(answer.toLowerCase().split(/[^a-z0-9+#]+/).map(normalizeToken).filter((token) => token && !stopWords.has(token)));
  const lowerAnswer = answer.toLowerCase();
  const covered: string[] = [];
  const missed: string[] = [];
  for (const point of expectedPoints) {
    const tokens = point.toLowerCase().split(/[^a-z0-9+#]+/).map(normalizeToken).filter((token) => token && !stopWords.has(token));
    if (!tokens.length) continue;
    const hits = tokens.filter((token) => answerTokens.has(token)).length;
    const hitRatio = hits / tokens.length;
    if (hitRatio >= 0.5 || (point.length > 6 && lowerAnswer.includes(point.toLowerCase()))) covered.push(point);
    else missed.push(point);
  }
  return { covered, missed };
}

export function offlineEvaluateAnswer(question: string, answer: string, expectedPoints: string[]): AnswerEvaluation {
  const trimmed = answer.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const { covered, missed } = pointCoverage(expectedPoints, answer);
  const coverageRatio = expectedPoints.length ? covered.length / expectedPoints.length : 0.5;
  const lengthScore = wordCount < 20 ? wordCount / 40 : wordCount < 60 ? 0.5 + (wordCount - 20) / 160 : wordCount <= 220 ? 0.75 : 0.8;
  const hasStructure = /\b(first|second|third|finally|then|next|lastly|overall|because|so that|as a result)\b/i.test(answer);
  const hasExample = /\b(for example|for instance|in my (last|previous)|at (my|a) (company|project|internship)|e\.g\.|when i)\b/i.test(answer);
  const hasFirstPerson = /\bi (built|led|designed|implemented|managed|created|solved|fixed|improved|learned|decided|worked|handled)\b/i.test(answer);
  const hasMetric = /\b\d+(\.\d+)?\s*(%|percent|x\b|users|hours|days|weeks|months|ms\b|seconds|minutes)/i.test(answer);

  let score = 30 + coverageRatio * 42 + lengthScore * 18 + (hasStructure ? 5 : 0) + (hasExample ? 3 : 0) + (hasFirstPerson ? 2 : 0) + (hasMetric ? 2 : 0);
  if (wordCount < 12) score = Math.min(45, score);
  score = Math.max(18, Math.min(96, Math.round(score)));

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (covered.length) strengths.push(`Covered key expected points: ${covered.slice(0, 3).join(", ")}.`);
  if (wordCount >= 60) strengths.push("Answer is developed with enough detail to show real understanding.");
  if (hasStructure) strengths.push("Uses signposting (first, then, finally) that makes the reasoning easy to follow.");
  if (hasExample) strengths.push("Grounds the answer in a concrete example, which builds credibility.");
  if (hasFirstPerson) strengths.push("Clear ownership of actions (\"I built / I led\") instead of vague team references.");
  if (hasMetric) strengths.push("Includes measurable impact, which strengthens the result.");
  if (!strengths.length) strengths.push("You attempted the question directly and stayed on topic.");
  if (!strengths.some((item) => item.includes("ownership"))) improvements.push("Use first-person ownership: say what you specifically did, not just what the team did.");
  if (strengths.length < 2) strengths.push("Answer is concise, which keeps the interviewer engaged.");
  if (missed.length) improvements.push(`Extend the answer to address: ${missed.slice(0, 3).join(", ")}.`);
  if (wordCount < 50) improvements.push("Add one concrete example or scenario to make the answer memorable (aim for 60-120 seconds of speech).");
  if (!hasStructure) improvements.push("Structure the answer with a simple frame (situation → action → result) or signposting words.");
  if (!hasMetric) improvements.push("Quantify the outcome where possible (time saved, %, users impacted).");
  if (wordCount > 260) improvements.push("Tighten the answer — practice delivering it in under 2 minutes.");
  while (improvements.length < 2) improvements.push("Record yourself answering and rehearse for a confident, steady delivery.");

  const feedback = `Overall score ${score}/100. You covered ${covered.length} of ${expectedPoints.length || "the expected"} key points with ${wordCount} words of response. ${score >= 80 ? "This is interview-ready — keep the structure and add polish." : score >= 60 ? "A solid base — the suggestions above will lift it to interview-ready." : "Focus on the structure and completeness suggestions; run this question again after practicing."}`;

  return { score, strengths: strengths.slice(0, 5), improvements: improvements.slice(0, 5), feedback, coveredPoints: covered, missedPoints: missed };
}

// ---------- Job fit ----------

export function offlineJobFit(options: {
  resumeText: string;
  candidateSkills: string[];
  job: { title: string; company?: string; location?: string; tags?: string[]; description?: string; summary?: string };
}): JobFitResult {
  const { resumeText, candidateSkills, job } = options;
  const listingText = [
    job.title,
    job.company || "",
    job.location || "",
    ...(Array.isArray(job.tags) ? job.tags : []),
    job.description || job.summary || "",
  ].join(" ");

  const resumeBlob = `${resumeText} ${candidateSkills.join(" ")}`;
  const blobSkills = findSkills(resumeBlob).map((skill) => skill.name);
  const jobSkills = findSkills(listingText);
  const jobSkillNames = [...new Set(jobSkills.map((skill) => skill.name))];
  const candidateSet = new Set([...blobSkills, ...candidateSkills].map((name) => name.toLowerCase().split(" (")[0].trim()));

  const matched = jobSkillNames.filter((name) => candidateSet.has(name.toLowerCase()));
  const missing = jobSkillNames.filter((name) => !candidateSet.has(name.toLowerCase()));

  const denominator = Math.max(jobSkillNames.length, matched.length, 5);
  const fitScore = Math.max(25, Math.min(95, Math.round(35 + 60 * (matched.length / denominator))));

  const rawSkills = candidateSkills.map((name) => name.split(" (")[0].trim()).filter(Boolean);
  const strengths: string[] = [];
  if (matched.length) strengths.push(`Direct overlap on ${matched.slice(0, 5).join(", ")} requested in the listing.`);
  if (rawSkills.length) strengths.push(`Assessed skills include ${rawSkills.slice(0, 4).join(", ")} with self-rated proficiency.`);
  if (resumeText) strengths.push("Resume evidence available to tailor the application to this exact posting.");
  if (!strengths.length) strengths.push("Baseline profile exists — the next step is adding concrete skills evidence for this role type.");

  const skillGaps: string[] = [];
  if (missing.length) skillGaps.push(`Listing mentions ${missing.slice(0, 5).join(", ")} — build or surface these in your application.`);
  skillGaps.push(missing.length || jobSkillNames.length ? "Quantify at least two achievements relevant to this job's core responsibilities." : "The listing is sparse — study the company and infer the stack before applying.");
  if (!matched.length) skillGaps.push("No strong keyword overlap detected; rewrite your resume summary specifically for this role.");

  const nextSteps: string[] = [];
  nextSteps.push("Tailor the top third of your resume to mirror this job's exact keywords.");
  if (missing.length) nextSteps.push(`Spend a focused week on ${missing[0]} and build one small demonstrable project with it.`);
  nextSteps.push("Prepare two STAR stories that map to this role's core responsibilities.");
  nextSteps.push("Apply through the original posting and follow up within 5-7 days.");

  const summary = `${job.title} at ${job.company || "the company"} shows ${fitScore >= 75 ? "strong" : fitScore >= 55 ? "moderate" : "partial"} alignment with the available profile. ${matched.length ? `Matched requirements: ${matched.slice(0, 4).join(", ")}.` : "No strong keyword matches were found in the current evidence."} ${missing.length ? `Main gaps to address: ${missing.slice(0, 3).join(", ")}.` : ""} ${resumeText ? "" : "No resume was provided, so the score relies on assessed skills only."}`.trim();

  return { fitScore, summary, strengths: strengths.slice(0, 5), skillGaps: skillGaps.slice(0, 5), nextSteps: nextSteps.slice(0, 5) };
}

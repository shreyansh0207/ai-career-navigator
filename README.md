# AI Career Navigator

An AI-assisted career workspace for resume analysis, skill roadmaps, interview practice, job search, and mentor discovery. Candidate accounts and their career data are stored in a local MongoDB database.

## Live demo

**https://shreyansh0207.github.io/ai-career-navigator/**

The live demo runs entirely in the browser: accounts, profiles, resumes, mindmaps, interviews, and saved jobs persist in your browser's localStorage, and job search pulls live listings from public APIs. AI features work out of the box with smart built-in results; you can optionally paste your own free [Groq](https://console.groq.com/keys) API key (stored only in your browser) to get live LLM-generated analyses.

For the full stack (Express + MongoDB + Groq), run the project locally as described below.

## Requirements

- Node.js 20 or later
- npm
- MongoDB running locally at `mongodb://localhost:27017/`
- A Groq API key for AI-powered features

## Run locally

```sh
npm install
copy .env.example .env
```

Set `GROQ_API_KEY` in `.env`, then start the API and Vite frontend together:

```sh
npm run dev
```

Open <http://localhost:8080>. The API connects to the `skillquest` database and listens on port 3001. Check its database connection at <http://localhost:3001/api/health>.

## Candidate accounts and data

Create an account with an email and password. Passwords are stored as bcrypt hashes; signed sessions identify the candidate whose MongoDB profile is loaded and updated. Resume text and analysis, generated roadmaps, skill levels, interview sessions and evaluations, job-search preferences, and mentor requests are persisted in that profile.

The local development JWT secret is only for localhost use. Set a unique `JWT_SECRET` before exposing the API outside your machine. Keep `.env` private; never put API keys in frontend code or source control.

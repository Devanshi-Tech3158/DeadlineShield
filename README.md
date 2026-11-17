# 🛡️ DeadlineShield — AI-Powered Student Deadline Protector

> **"Never Miss a Deadline. Plan Smart. Stay Ahead."**

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2563EB?style=for-the-badge&logo=github&logoColor=white)](https://devanshi-tech3158.github.io/DeadlineShield/)
[![AI Engine](https://img.shields.io/badge/Google_Gemini-3.8_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
[![Test Suite](https://img.shields.io/badge/Tests-10_Passing-16A34A?style=for-the-badge)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-0F172A?style=for-the-badge)](LICENSE)

---

### 🌐 Live Deployment & Links
- **🔗 Live Web Application:** **[https://devanshi-tech3158.github.io/DeadlineShield/](https://devanshi-tech3158.github.io/DeadlineShield/)**
- **💻 GitHub Source Repository:** **[https://github.com/Devanshi-Tech3158/DeadlineShield](https://github.com/Devanshi-Tech3158/DeadlineShield)**
- **🏆 Hackathon 2026 Track:** Education & Productivity
- **👤 Developer:** Devanshi Goyal (Solo Innovator)

---

## 📸 Product Preview

![DeadlineShield SaaS Dashboard Preview](assets/preview.jpg)

---

## 📖 Executive Summary

University and high school students manage dozens of assignments, semester projects, laboratory records, and examinations across disparate platforms, emails, and WhatsApp groups.

### The Problem
- **Scattered Deadlines:** No single unified radar for upcoming examinations, assignments, and submissions.
- **Unclear Task Priorities:** Difficulty determining whether a 10-page project due in 3 days takes precedence over an exam tomorrow.
- **Overwhelming Assignments:** Large semester projects induce procrastination because students don't know where to start.
- **Last-Minute Panic:** Late submissions, high stress, and degraded academic performance.

### The Solution
DeadlineShield is an AI-assisted academic productivity platform built around a student-first philosophy: **AI only suggests; students always remain in full control**.

1. **Unified Deadline Manager:** Consolidates assignments, examinations, projects, lab work, and presentations with status tracking, filtering, sorting, and LocalStorage persistence.
2. **Intelligent Priority Engine:** Deterministic multi-factor mathematical scoring (due date, effort-to-time ratio, difficulty, and academic category) that works 100% offline without external API dependencies.
3. **AI Task Breakdown (Main USP):** Directly integrated with **Google Gemini AI** to divide daunting assignments into 3–6 manageable, scheduled daily micro-milestones with estimated effort.
4. **Needs Attention Command Center:** Auto-highlights overdue tasks, deadlines within 24 hours, and unfinished subtasks.
5. **Comprehensive Progress Tracker & Calendar:** Visualizes subject-level velocity, overall completion rates, and a 14-day chronological timeline.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client (Vanilla Web Stack)"]
        UI["Linear/Notion SaaS UI<br/>(HTML5 / CSS3 / Vanilla JS)"]
        Storage["Browser LocalStorage<br/>(Reactive Data Store)"]
        PriorityEngine["Client-Side Priority Calculator<br/>(Zero Latency UI Updates)"]
        UI --> Storage
        UI --> PriorityEngine
    end

    subgraph Backend["Backend Service (Node.js + Express)"]
        Server["Express API Server<br/>(Port: process.env.PORT)"]
        Validator["Input & Schema Validator<br/>(Sanitization & Type Safety)"]
        GeminiService["Gemini AI Service<br/>(@google/genai & @google/generative-ai)"]
        FallbackService["Academic Template Generator<br/>(Verified Pedagogical Fallback)"]
        
        Server --> Validator
        Validator --> GeminiService
        GeminiService -.->|On API Failure or Missing Key| FallbackService
    end

    subgraph Cloud["External AI Engine"]
        GeminiCloud["Google Gemini AI<br/>(gemini-3.8-flash / gemini-2.5-flash)"]
    end

    UI -->|POST /api/breakdown| Server
    UI -->|GET /api/health| Server
    GeminiService -->|Secure HTTPS + System Instructions| GeminiCloud
```

---

## 🌟 Key Modules & Features

### 1. Professional Dashboard
- Personalized greeting and daily rotating motivational quotes.
- Real-time stat cards: Total Tasks, Pending Tasks, Completed Tasks, Overdue Tasks, Upcoming (<72h), and Completion Rate %.
- **Live Countdown Ticker:** Dynamically displays days, hours, minutes, and seconds until the closest active deadline.
- Quick priority widget highlighting today's most urgent action items.

### 2. Unified Deadline Manager
- Supports **Assignments, Examinations, Projects, Lab Work, Presentations**, and Other academic categories.
- Tracks course code, estimated effort (hours), difficulty level (Easy / Medium / Hard), due date & time, status, and custom notes.
- Instant multi-criteria filtering: search by title/course, filter by category, status, and priority.
- Sorting options: Earliest deadline, Latest deadline, Priority score, Effort, Title.
- **Export to CSV:** One-click spreadsheet export for offline academic scheduling.
- **Pre-populated Demo Data:** Includes rich starter tasks on first launch.

### 3. Intelligent Priority Engine
- Calculates priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) mathematically based on:
  $$\text{Urgency Score} = \text{Base Time Points} + \left(\frac{\text{Effort Hours}}{\text{Available Hours}} \times 25\right) + \text{Category Bonus} + \text{Difficulty Bonus}$$
- Produces plain-English explanations for every decision (e.g., *"Your CS201 Examination is CRITICAL priority because it is due in 18 hours and requires approximately 8 hours of hard effort."*).
- Operates independently of external networks.

### 4. AI Task Breakdown Engine (Main USP)
- Student inputs task details or selects an existing deadline.
- Queries Google Gemini with structured system instructions and JSON response schema.
- Returns a day-by-day roadmap (Step title, description, suggested day, duration, completion toggle).
- **Interactive & Editable:** Students can tweak step names, edit duration, delete unneeded steps, add their own custom milestones, and save the roadmap directly back into their task.
- **Dual-Mode Reliability:** Runs both via backend Express proxy and with automatic client-side academic engine fallbacks for static web deployment.

### 5. Needs Attention Center
- Categorizes high-risk items: Overdue (Red alert), Due within 24 Hours (Urgent), Due within 3 Days (Warning), and Active Plans with pending steps.

### 6. Progress Tracker & 14-Day Calendar
- Overall progress gauge and micro-step velocity.
- Course-level breakdown (e.g. CS204: 60% done, CS201: 33% done).
- 14-day interactive chronological timeline view with urgency color-coded dots.

---

## 🚀 Quickstart & Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher; v24 recommended)
- npm (v9.0.0 or higher)

### 1. Clone Repository
```bash
git clone https://github.com/Devanshi-Tech3158/DeadlineShield.git
cd DeadlineShield
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your Google Gemini API key:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```

> **How to get a free Gemini API key:**
> 1. Visit [Google AI Studio](https://aistudio.google.com/).
> 2. Click **Create API Key**.
> 3. Paste the key into your `.env` file.

### 3. Start Local Server
```bash
# Start production server
npm start

# Or run with auto-reload during development
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Automated Testing

DeadlineShield includes unit and integration tests using Node's native test runner (`node:test`):

```bash
npm test
```

### Verified Test Suite (10/10 Passing):
- `tests/priority.test.js`: Validates completed tasks, overdue calculations, CRITICAL threshold detection, and student explanation text.
- `tests/validation.test.js`: Validates input sanitization, title constraints, and subtask schemas.
- `tests/api.test.js`: Validates `GET /api/health`, `POST /api/breakdown` payload validation, and subtask generation.

---

## 🎬 2–3 Minute Hackathon Demo Walkthrough

1. **Dashboard Overview (0:00 - 0:30):**
   - Open [https://devanshi-tech3158.github.io/DeadlineShield/](https://devanshi-tech3158.github.io/DeadlineShield/).
   - Point out the live countdown ticker, daily motivational quote, and metric cards.
2. **Unified Deadline Manager (0:30 - 1:00):**
   - Click **My Deadlines**. Filter by "Examination" or search "DBMS".
   - Show how the Priority Engine automatically tagged the Data Structures Midterm as `CRITICAL` because it's due in 18 hours with 8 hours of hard effort.
3. **AI Task Breakdown — The USP (1:00 - 1:50):**
   - Switch to **AI Task Planner**.
   - Click **"⚡ Load Hackathon Demo Example (DBMS Mini Project)"**.
   - Click **"Generate AI Plan"**.
   - Watch the plan generate a 5-day structured plan.
   - Edit "Day 3: Implement Core CRUD Operations" inline to prove student control.
   - Click **"Save Final Plan to Task"**.
4. **Needs Attention & Progress Tracker (1:50 - 2:30):**
   - Click **Needs Attention** to showcase overdue detection and 24h warnings.
   - Open **Progress Tracker** to view subject-wise progress bars.
   - Toggle Dark/Light mode using the top-right button to demonstrate UI polish.

---

## 🌐 Deployment Instructions

### Option A: GitHub Pages (Live)
The frontend is deployed to GitHub Pages at:
**[https://devanshi-tech3158.github.io/DeadlineShield/](https://devanshi-tech3158.github.io/DeadlineShield/)**

Automated via `.github/workflows/deploy.yml`.

### Option B: Render (Full-Stack Node.js Service)
1. In [Render Dashboard](https://dashboard.render.com/), click **New Web Service**.
2. Connect your repository: `https://github.com/Devanshi-Tech3158/DeadlineShield`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add Environment Variables:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Key)*
   - `GEMINI_MODEL`: `gemini-3.8-flash`

---

## 👤 Developer Profile

- **Developer:** Devanshi Goyal
- **Role:** Solo Innovator (Full-Stack Engineer, AI Architect & UI Designer)
- **Competition:** Hackathon 2026
- **Repository:** [https://github.com/Devanshi-Tech3158/DeadlineShield](https://github.com/Devanshi-Tech3158/DeadlineShield)
- **License:** MIT License

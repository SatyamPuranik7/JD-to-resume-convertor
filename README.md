# ResuMatch AI ⚡
> Free AI-Powered ATS Resume Customizer & Job Description Matcher. Built for the #BuildInPublic 7 Quests Challenge.

Live demo: https://jd-to-resume-convertor.vercel.app/

ResuMatch AI analyzes any candidate resume against a target job description, calculates a real-time ATS match score, highlights missing keywords, and rewrites bullet points using the Google XYZ for[...]

---

## 🚀 Features

- **Side-by-Side Analysis:** Paste or upload Job Descriptions and Resumes (`.txt`, `.pdf`, `.md`, `.doc`).
- **Before vs. After ATS Match Scoring:** Shows original match percentage vs. tailored score increase.
- **Keyword Gap Detection:** Visual badges for matched hard skills and injected missing keywords.
- **Google XYZ Bullet Point Rewriter:** Rewrites accomplishments to highlight quantifiable business impact.
- **Interactive Quick-Edit Mode:** Edit any bullet, title, or summary directly in the browser.
- **1-Click Clean PDF Export:** ATS-friendly, single-column formatting ready for submission.
- **OpenRouter AI Engine:** Powered by low-latency models (`deepseek/deepseek-chat`, `meta-llama/llama-3.3-70b-instruct`).
- **SEO & Analytics Ready:** Next.js App Router, dynamic `sitemap.xml`, `robots.txt`, JSON-LD schema, and PostHog tracking.

---

## 🛠️ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-username/resumatch-ai.git
cd resumatch-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your OpenRouter API key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

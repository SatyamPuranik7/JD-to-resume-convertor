'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  RefreshCw,
  UploadCloud,
  ChevronDown,
  Key
} from 'lucide-react';
import { TailorResponse } from '@/types/resume';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import ResumePDFView from '@/components/ResumePDFView';

const SAMPLE_JD = `Role: Product Management Intern
Company: slice
Location: Bengaluru / Remote

About the Role:
slice is looking for passionate Product Management Interns who are eager to learn and contribute to solving digital payment challenges for young Indians. If you’re excited about the fast-growing payments space and want to build technology that impacts millions, we’d love to meet you.

What you will do:
- Understand users, internal teams, and partner needs to identify problems and opportunities.
- Support in creating scalable product solutions that drive customer delight.
- Assist in defining and prioritizing the product roadmap.
- Work closely with product leaders and cross-functional teams to execute strategies.
- Contribute to continuous improvements through iterative releases.
- Develop a deep understanding of how users interact with slice, their problems, behaviours, and opportunities for a better experience.

What you will need:
- Strong interest in Product Management, fintech, and solving complex customer problems.
- Good written and verbal communication skills with the ability to articulate thoughts clearly.
- Curiosity, creativity, and willingness to collaborate with engineering, design, analytics, marketing, and business teams.
- Ability to turn incomplete or ambiguous inputs into clear next steps.
- Bonus: Prior internship or academic projects related to tech, product, or user research.`;

const SAMPLE_RESUME = `Satyam Puranik
Jalna, Maharashtra | 9175113746 | satyampuranik7@gmail.com
linkedin.com/in/satyam-puranik-80b271307 | github.com/SatyamPuranik7

Summary
Experience coordinating multi-entrance examination operations and managing a 25+ person team, with additional hands-on work building AI prototypes and analyzing customer feedback, model evaluation, and technical product scenarios. Brings strengths in operations, team coordination, structured problem-solving, and applied AI tools.

Selected Projects
ModelCompare | AI model evaluation prototype
- Built a prototype for side-by-side LLM response comparisons using configurable models and a consistent evaluation rubric.
- Framed model-selection uncertainty from qualitative user observation and defined model selection rate as the primary metric.

Voice-of-Customer Agent | AI MVP
- Built an MVP that ingests app-store reviews, filters and groups feedback, and surfaces recurring themes, user impact, and severity estimates.
- Designed a human-in-the-loop workflow that automates review analysis while keeping roadmap and prioritization decisions with the PM.

QuickBite Payment SDK RCA | Simulated case study
- Analyzed a simulated order-completion decline from 92% to 82%, isolated callback processing as the main anomaly, and proposed a phased release strategy.

Rapido Night Safety | Independent concept
- Designed a rider-safety flow combining driver verification, trusted contacts, live location sharing, and emergency SOS.

Experience
Center Manager, CET Cell | MSS's College of Engineering, Jalna | Mar 2026 to May 2026
- Coordinated examination operations and facility readiness for multi-entrance examinations.
- Managed and coordinated 25+ invigilators and support staff while maintaining examination protocols.
- Resolved candidate, logistics, and coordination issues in a high-pressure examination environment.

Education and Certification
Bachelor of Arts BAMU University | Graduated 2024
TCS iON Career Edge Young Professionals

Skills
Product: Product strategy, prioritization, user research, root-cause analysis, experimentation, product metrics, MVP thinking
AI: LLMs, RAG, embeddings, AI evaluation, prompting, AI product design
Tools: Figma, Jira, Google AI Studio, OpenRouter, Vercel, Streamlit, Framer, Lovable, Bolt, Antigravity`;

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'formatted' | 'text'>('formatted');

  useEffect(() => {
    initAnalytics();
    trackEvent('page_view', { page: 'home' });
  }, []);

  const handleLoadSample = () => {
    setJobDescription(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
    setError(null);
    trackEvent('sample_loaded');
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'resume' | 'jd'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    trackEvent('file_uploaded', { target, fileName: file.name, size: file.size });

    // Handle plain text / markdown
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (target === 'resume') setResumeText(text);
        else setJobDescription(text);
      };
      reader.readAsText(file);
    } else {
      // For binary files like pdf/doc, read as text fallback or alert
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Basic printable string extraction for quick demo
        const cleanText = text.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ');
        if (target === 'resume') setResumeText(cleanText.slice(0, 5000));
        else setJobDescription(cleanText.slice(0, 5000));
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyzeAndTailor = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both the Job Description and your Resume.');
      return;
    }

    setIsLoading(true);
    setError(null);
    trackEvent('analysis_started', {
      resumeLength: resumeText.length,
      jdLength: jobDescription.length
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (customKey.trim()) {
        headers['x-openrouter-key'] = customKey.trim();
      }

      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resumeText,
          jobDescription
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      setResult(data);
      trackEvent('analysis_completed', {
        originalScore: data.originalScore,
        tailoredScore: data.tailoredScore,
        scoreGain: data.tailoredScore - data.originalScore
      });

      // Smooth scroll down to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      trackEvent('analysis_failed', { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('reset_clicked');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-lg tracking-tight">
                Resu<span className="text-emerald-400">Match</span> AI
              </span>
              <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                ATS Optimizer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSample}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Try Sample Data
            </button>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 transition p-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
              title="Custom OpenRouter Key"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Custom API Key input */}
        {showKeyInput && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 text-xs flex items-center justify-center gap-2 text-slate-300">
            <span>Custom OpenRouter API Key (optional):</span>
            <input
              type="password"
              placeholder="sk-or-v1-..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 w-64 focus:outline-none focus:border-emerald-500"
            />
            {customKey && (
              <span className="text-emerald-400 text-[11px]">Using custom key</span>
            )}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 no-print">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Beat the ATS Algorithm in 30 Seconds
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Tailor Your Resume to Any{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Job Description
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Upload the job description and your current resume. Get an accurate ATS score,
            extract missing keywords, and export a perfectly matched resume ready for PDF download.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-900/60 text-slate-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-400">Zero-Hallucination Engine:</span>
            <span>All degrees, companies, dates, and certifications are 100% preserved.</span>
          </div>
        </div>

        {/* Input Cards: Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 no-print">
          {/* Box 1: Target Job Description */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    1. Target Job Description (JD)
                  </h2>
                </div>
                <label className="cursor-pointer text-xs font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'jd')}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description, responsibilities, and required qualifications here..."
                rows={12}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed font-mono"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
              <span>{jobDescription.length} characters</span>
              {jobDescription.length > 50 && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>
          </div>

          {/* Box 2: Candidate Resume */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    2. Your Current Resume
                  </h2>
                </div>
                <label className="cursor-pointer text-xs font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept=".txt,.md,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'resume')}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your existing resume (experience, summary, skills, education) here..."
                rows={12}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed font-mono"
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
              <span>{resumeText.length} characters</span>
              {resumeText.length > 50 && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button & Error Banner */}
        <div className="flex flex-col items-center justify-center gap-4 mb-12 no-print">
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleAnalyzeAndTailor}
            disabled={isLoading || !resumeText.trim() || !jobDescription.trim()}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950/50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Optimizing with OpenRouter AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>Calculate ATS Score & Tailor Resume</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div id="results-section" className="scroll-mt-24 space-y-8 animate-in fade-in duration-500">
            {/* ATS Score & Keyword Analysis Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl no-print">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
                {/* Score Comparison */}
                <div className="flex items-center gap-6">
                  {/* Original Score */}
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                      Original ATS Match
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold text-slate-400 mt-1">
                      {result.originalScore}%
                    </div>
                  </div>

                  <ArrowRight className="w-6 h-6 text-emerald-400 shrink-0" />

                  {/* Tailored Score */}
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                      Tailored Match
                    </span>
                    <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                      {result.tailoredScore}%
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Rating Badge & Reset Button */}
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Rating: {result.matchRating}</span>
                  </div>

                  <button
                    onClick={handleReset}
                    className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    title="Start fresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Keyword & Improvements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Matched & Injected Keywords */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">
                    Keywords Injected & Matched from JD:
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords?.slice(0, 10).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/40"
                      >
                        ✓ {kw}
                      </span>
                    ))}
                    {result.missingKeywordsAdded?.slice(0, 6).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-teal-950/70 text-teal-300 border border-teal-800/40"
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Improvements Made */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">
                    Key Improvements Made:
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {result.improvements?.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between no-print border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('formatted')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'formatted'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Formatted ATS Resume & PDF
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'text'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Text / Markdown
                </button>
              </div>
            </div>

            {/* Active View Content */}
            {activeTab === 'formatted' ? (
              <ResumePDFView
                resume={result.tailoredResume}
                rawText={result.tailoredResumeText}
              />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <pre className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-6 rounded-xl border border-slate-800">
                  {result.tailoredResumeText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* SEO & Educational Section below fold */}
        <section className="mt-20 pt-12 border-t border-slate-800/80 no-print">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-100">
              Why ATS Resume Optimization Matters
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Over 90% of Fortune 500 companies and tech firms use Applicant Tracking Systems (ATS)
              like Greenhouse, Lever, and Workday to screen candidates before a human recruiter ever sees your application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">1. Exact Keyword Alignment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ATS scanners filter candidates based on required technical keywords, tools, and certifications.
                ResuMatch injects missing keywords naturally without keyword stuffing.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">2. Google XYZ Formula</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bullet points are rewritten to highlight measurable outcomes: &quot;Accomplished [X] measured by [Y], by doing [Z]&quot; to impress both robots and hiring managers.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">3. Clean Single-Column PDF</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-column designs and complex graphic charts cause parsing failures in ATS parsers. Our exporter uses clean, single-column, standard typography.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 ResuMatch AI. Built for the #BuildInPublic Challenge.</span>
          <div className="flex gap-4">
            <a href="#how-it-works" className="hover:text-slate-400 transition">How It Works</a>
            <a href="#privacy" className="hover:text-slate-400 transition">Privacy First</a>
            <a href="#ats-faq" className="hover:text-slate-400 transition">ATS Guide</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { TailorResponse } from '@/types/resume';
import { sanitizeAndGroundResume } from '@/lib/sanitizer';

const SYSTEM_PROMPT = `You are a Principal Executive Recruiter and ATS (Applicant Tracking System) Algorithm Expert with 15+ years of experience.

Your mission is to tailor a candidate's REAL Resume to match a target Job Description (JD) to achieve the highest possible ATS match score, WITHOUT EVER FABRICATING OR HALLUCINATING UNTRUE INFORMATION.

CRITICAL INTEGRITY & TRUTH RULES (MANDATORY & UNCOMPROMISING):
1. LEGAL HISTORICAL FACTS ARE IMMUTABLE:
   - A candidate's DEGREE, MAJOR, UNIVERSITY, PAST COMPANIES, JOB TITLES, and DATES are historical legal records.
   - YOU MUST NEVER CHANGE A DEGREE (e.g., if a candidate has a Bachelor of Arts, DO NOT change it to Computer Science, Engineering, or anything else).
   - NEVER CHANGE A UNIVERSITY NAME OR GRADUATION YEAR.
   - NEVER INVENT PAST EMPLOYERS, INTERNSHIPS, OR ROLES.
   - Doing so makes a resume fraudulent and will cause the candidate to be blacklisted.
2. ZERO HALLUCINATION OF CONTACT INFO, CERTIFICATIONS, OR PROJECTS:
   - Extract real Name, Phone, Email, Location, LinkedIn, and Portfolio directly from the candidate's resume.
   - NEVER use placeholder dummy text like "(555) 000-0000", "City, State", "Candidate Name", "Tech Startup", or "University Name".
   - If the candidate's resume does NOT list certifications, return an empty array [] for certifications. NEVER invent Agile, PMP, AWS, or PM certifications that the user never earned.
   - Only include real projects the candidate actually listed. Do NOT invent fictional projects.
3. WHAT TAILORING ACTUALLY MEANS:
   - Rephrase the candidate's ACTUAL bullet points (both in Experience and Projects) to highlight transferable skills, action verbs, and relevance to the target JD.
   - Highlight and prioritize the candidate's REAL skills that match keywords found in the JD.
   - Reframe the Professional Summary to position the candidate's real capabilities and enthusiasm for the target role.
   - Structure bullets using the Google XYZ formula ("Accomplished [X] measured by [Y], by doing [Z]") strictly grounded in the candidate's real scope of work.
   - Never invent fictitious metrics that distort reality; strengthen phrasing, clarity, and keyword density naturally.

OUTPUT FORMAT:
You MUST return ONLY a valid, parseable JSON object matching this schema:
{
  "originalScore": number, // Realistic ATS match percentage (0-100) before tailoring
  "tailoredScore": number, // Optimized ATS match score (typically 85-98)
  "matchRating": "Exceptional" | "Strong" | "Moderate" | "Needs Improvement",
  "matchedKeywords": ["string"], // Real keywords from JD already in candidate's profile
  "missingKeywordsAdded": ["string"], // Relevant JD keywords organically integrated into summary/bullets/skills
  "improvements": ["string", "string", "string"], // 3-4 specific factual improvements made
  "tailoredResume": {
    "contact": {
      "name": "string (Exact candidate name from resume)",
      "title": "string (Candidate's target role or tailored title based on their experience)",
      "email": "string (Exact email from resume, or empty string)",
      "phone": "string (Exact phone from resume, or empty string)",
      "location": "string (Exact location from resume, or empty string)",
      "linkedin": "string (Exact linkedin URL/handle from resume, or empty string)",
      "portfolio": "string (Exact portfolio/github from resume, or empty string)"
    },
    "summary": "string (Tailored professional summary grounded strictly in candidate's real background)",
    "skills": [
      {
        "category": "string (e.g., Core Product Competencies, Technical & AI Skills, Tools)",
        "items": ["string"]
      }
    ],
    "experience": [
      {
        "role": "string (Candidate's actual role)",
        "company": "string (Candidate's actual company name)",
        "period": "string (Candidate's actual dates)",
        "location": "string (Candidate's actual location if provided, else empty string)",
        "bullets": [
          "string (Strong action-oriented bullet point emphasizing real achievements aligned with JD keywords)"
        ]
      }
    ],
    "projects": [
      {
        "name": "string (Only real projects from original resume)",
        "description": "string (Concise summary of project scope)",
        "tech": ["string"],
        "bullets": [
          "string (Action-oriented bullet point emphasizing user outcomes, metrics, or problem-solving)"
        ]
      }
    ],
    "education": [
      {
        "degree": "string (Candidate's EXACT actual degree - NEVER alter degree or field of study)",
        "school": "string (Candidate's actual institution)",
        "year": "string (Candidate's actual graduation year)"
      }
    ],
    "certifications": ["string (Only real certifications from original resume, or empty array if none)"]
  },
  "tailoredResumeText": "string (Clean full-text representation of the exact tailored resume)"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription, model = 'deepseek/deepseek-chat' } = body;

    if (!resumeText?.trim() || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: 'Both Resume and Job Description are required.' },
        { status: 400 }
      );
    }

    const apiKey =
      req.headers.get('x-openrouter-key') ||
      process.env.OPENROUTER_API_KEY ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured.' },
        { status: 500 }
      );
    }

    const modelsToTry = [
      model,
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct',
      'nvidia/nemotron-3.5-lightning:free'
    ];

    const uniqueModels = Array.from(new Set(modelsToTry));

    let lastError = '';
    let responseData: TailorResponse | null = null;

    for (const targetModel of uniqueModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://resumatch.ai',
            'X-Title': 'ResuMatch AI'
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Here is the TARGET JOB DESCRIPTION (JD):\n"""\n${jobDescription}\n"""\n\n---\n\nHere is the CANDIDATE'S ORIGINAL RESUME:\n"""\n${resumeText}\n"""\n\nCRITICAL DIRECTIVE: Every single factual credential (degree name, major, university, company name, dates, contact numbers) MUST BE 100% PRESERVED. Do not invent fake degrees or certifications under any circumstances. Return only valid JSON.`
              }
            ],
            temperature: 0.15, // Extremely low temperature for rigorous factual adherence
            max_tokens: 3800
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `Model ${targetModel} failed (${response.status}): ${errText}`;
          console.warn(lastError);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          lastError = `Model ${targetModel} returned empty content.`;
          continue;
        }

        const cleaned = content
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();

        const parsed: TailorResponse = JSON.parse(cleaned);

        if (typeof parsed.originalScore !== 'number' || !parsed.tailoredResume) {
          throw new Error('Incomplete JSON structure received.');
        }

        // Programmatic Guardrail: Sanitize and enforce ground-truth facts
        parsed.tailoredResume = sanitizeAndGroundResume(resumeText, parsed.tailoredResume);

        responseData = parsed;
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`Attempt with ${targetModel} failed:`, lastError);
      }
    }

    if (!responseData) {
      return NextResponse.json(
        {
          error:
            'Failed to generate tailored resume from OpenRouter models. Details: ' +
            lastError
        },
        { status: 502 }
      );
    }

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    console.error('Tailor API error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}

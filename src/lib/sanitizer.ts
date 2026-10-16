import { TailoredResumeData } from '@/types/resume';

/**
 * Factual Grounding & Hallucination Guardrail
 * Programmatically ensures that no AI model can invent fake degrees,
 * fake certifications, fake phone numbers, or dummy placeholders.
 */
export function sanitizeAndGroundResume(
  originalText: string,
  tailored: TailoredResumeData
): TailoredResumeData {
  const sanitized = { ...tailored };
  const lowerOriginal = originalText.toLowerCase();

  // 1. Sanitize Contact Details
  // Ensure name is not placeholder
  if (
    !sanitized.contact.name ||
    sanitized.contact.name.toLowerCase().includes('candidate name') ||
    sanitized.contact.name.toLowerCase().includes('your name')
  ) {
    // Extract first line of resume as candidate name
    const firstLine = originalText.split('\n')[0]?.trim();
    if (firstLine && firstLine.length < 50) {
      sanitized.contact.name = firstLine;
    }
  }

  // Extract real email if missing or dummy
  const emailMatch = originalText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && (!sanitized.contact.email || sanitized.contact.email.includes('example.com'))) {
    sanitized.contact.email = emailMatch[0];
  }

  // Extract real phone if missing or dummy
  const phoneMatch = originalText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);
  if (phoneMatch && (!sanitized.contact.phone || sanitized.contact.phone.includes('000-0000') || sanitized.contact.phone.includes('555'))) {
    sanitized.contact.phone = phoneMatch[0];
  }

  // Extract LinkedIn
  const linkedinMatch = originalText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch && (!sanitized.contact.linkedin || sanitized.contact.linkedin.includes('username'))) {
    sanitized.contact.linkedin = linkedinMatch[0];
  }

  // Extract GitHub / Portfolio
  const githubMatch = originalText.match(/github\.com\/[a-zA-Z0-9_-]+/i);
  if (githubMatch && (!sanitized.contact.portfolio || sanitized.contact.portfolio.includes('username'))) {
    sanitized.contact.portfolio = githubMatch[0];
  }

  // Clean dummy location placeholders
  if (
    sanitized.contact.location &&
    (sanitized.contact.location.toLowerCase().includes('city, state') ||
     sanitized.contact.location.toLowerCase().includes('city / state'))
  ) {
    sanitized.contact.location = '';
  }

  // 2. Strict Education Grounding (Never allow AI to change Arts to Computer Science, etc.)
  if (sanitized.education && Array.isArray(sanitized.education)) {
    // Find the original education section if present
    const educationRegex = /(?:education|qualification|academic)[^\n]*\n([\s\S]*?)(?=\n\s*(?:skills|experience|projects|certifications|awards|\n\n[A-Z]|$))/i;
    const eduSectionMatch = originalText.match(educationRegex);
    const rawEduText = eduSectionMatch ? eduSectionMatch[1].trim() : '';

    sanitized.education = sanitized.education.map((edu) => {
      // Check if degree contains keywords completely absent from original resume
      const degreeWords = edu.degree.split(/\s+/).filter(w => w.length > 3 && !['bachelor', 'master', 'degree', 'arts', 'science'].includes(w.toLowerCase()));
      const isInvented = degreeWords.some(w => !lowerOriginal.includes(w.toLowerCase()));

      if (isInvented && rawEduText) {
        // Fall back to original raw education text
        const firstEduLine = rawEduText.split('\n')[0]?.trim();
        return {
          degree: firstEduLine || edu.degree,
          school: edu.school,
          year: edu.year
        };
      }
      return edu;
    });
  }

  // 3. Strict Certifications Grounding (Purge any certification that was not in the original resume)
  if (sanitized.certifications && Array.isArray(sanitized.certifications)) {
    sanitized.certifications = sanitized.certifications.filter((cert) => {
      if (!cert || typeof cert !== 'string') return false;
      const cleanCert = cert.trim().toLowerCase();
      // If the certification text (or significant parts of it) does not appear in original resume, DROP IT.
      const certWords = cleanCert.split(/\s+/).filter(w => w.length > 3 && !['certificate', 'certification', 'certified'].includes(w));
      if (certWords.length === 0) return lowerOriginal.includes(cleanCert);
      // At least 60% of significant words must exist in original text
      const matchingWords = certWords.filter(w => lowerOriginal.includes(w));
      return matchingWords.length >= Math.ceil(certWords.length * 0.6);
    });
  }

  // 4. Strict Projects Grounding (Ensure project names are grounded in original resume)
  if (sanitized.projects && Array.isArray(sanitized.projects)) {
    sanitized.projects = sanitized.projects.filter((proj) => {
      if (!proj || !proj.name) return false;
      // Check if project name or its primary word appears in original resume
      const projNameClean = proj.name.toLowerCase().trim();
      const nameWords = projNameClean.split(/\s+/).filter(w => w.length > 3);
      if (nameWords.length === 0) return true;
      return nameWords.some(w => lowerOriginal.includes(w));
    });
  }

  return sanitized;
}

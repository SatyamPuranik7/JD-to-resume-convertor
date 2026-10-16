'use client';

import React, { useRef, useState } from 'react';
import { Download, Copy, Printer, Check, Edit2, Eye } from 'lucide-react';
import { TailoredResumeData } from '@/types/resume';
import { trackEvent } from '@/lib/analytics';

interface ResumePDFViewProps {
  resume: TailoredResumeData;
  rawText: string;
}

export default function ResumePDFView({ resume, rawText }: ResumePDFViewProps) {
  const [data, setData] = useState<TailoredResumeData>(resume);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const resumeContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      trackEvent('resume_copied', { role: data.contact.title });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleNativePrint = () => {
    trackEvent('resume_printed', { role: data.contact.title });
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!resumeContainerRef.current) return;
    setIsDownloadingPdf(true);
    trackEvent('pdf_download_clicked', { role: data.contact.title });

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = resumeContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // crisp high resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${data.contact.name.replace(/\s+/g, '_')}_Tailored_Resume.pdf`;
      pdf.save(fileName);
      trackEvent('pdf_download_completed', { fileName });
    } catch (error) {
      console.error('Error generating PDF:', error);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl mb-6 shadow-sm no-print">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">Resume Actions:</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditing ? 'Done Editing' : 'Quick Edit Mode'}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            title="Copy formatted text to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>

          <button
            onClick={handleNativePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            title="Print or Save via Browser"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloadingPdf ? 'Generating PDF...' : 'Download as PDF'}
          </button>
        </div>
      </div>

      {/* Standard ATS Document Sheet */}
      <div className="bg-slate-950 p-2 sm:p-6 rounded-2xl border border-slate-800 flex justify-center">
        <div
          ref={resumeContainerRef}
          id="printable-resume"
          className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 rounded-lg shadow-2xl font-sans leading-relaxed text-[13px]"
          style={{ minHeight: '1050px' }}
        >
          {/* Header & Contact */}
          <header className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <h1
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={(e) =>
                setData({
                  ...data,
                  contact: { ...data.contact, name: e.currentTarget.innerText }
                })
              }
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 uppercase font-serif"
            >
              {data.contact.name}
            </h1>
            <p
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={(e) =>
                setData({
                  ...data,
                  contact: { ...data.contact, title: e.currentTarget.innerText }
                })
              }
              className="text-sm font-semibold text-slate-700 tracking-wide mt-1 uppercase"
            >
              {data.contact.title}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-600">
              {data.contact.location && <span>{data.contact.location}</span>}
              {data.contact.phone && <span>• {data.contact.phone}</span>}
              {data.contact.email && <span>• {data.contact.email}</span>}
              {data.contact.linkedin && <span>• {data.contact.linkedin}</span>}
              {data.contact.portfolio && <span>• {data.contact.portfolio}</span>}
            </div>
          </header>

          {/* Professional Summary */}
          {data.summary && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                Summary
              </h2>
              <p
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={(e) => setData({ ...data, summary: e.currentTarget.innerText })}
                className="text-slate-800 text-justify leading-normal text-xs"
              >
                {data.summary}
              </p>
            </section>
          )}

          {/* Selected Projects (High priority for PM & Tech roles) */}
          {data.projects && data.projects.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-2">
                Selected Projects
              </h2>
              <div className="space-y-3">
                {data.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                      <span>{proj.name}</span>
                      {proj.tech && proj.tech.length > 0 && (
                        <span className="font-normal text-slate-600 italic">
                          {proj.tech.join(', ')}
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-slate-800 text-xs mt-0.5 leading-normal">
                        {proj.description}
                      </p>
                    )}
                    {proj.bullets && proj.bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800 text-xs leading-normal mt-1">
                        {proj.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                          >
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Experience */}
          {data.experience && data.experience.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-2">
                Experience
              </h2>
              <div className="space-y-3">
                {data.experience.map((job, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                      <span>{job.role}</span>
                      <span className="text-slate-600 font-normal">{job.period}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs text-slate-700 italic mb-1">
                      <span>{job.company}</span>
                      {job.location && <span>{job.location}</span>}
                    </div>
                    <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800 text-xs leading-normal">
                      {job.bullets.map((bullet, bIdx) => (
                        <li
                          key={bIdx}
                          contentEditable={isEditing}
                          suppressContentEditableWarning
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education and Certification */}
          {(data.education?.length > 0 || data.certifications?.length > 0) && (
            <section className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                Education & Certifications
              </h2>
              <div className="space-y-1">
                {data.education?.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{edu.degree}</span>
                      <span className="text-slate-700"> | {edu.school}</span>
                    </div>
                    <span className="text-slate-600">{edu.year}</span>
                  </div>
                ))}
                {data.certifications && data.certifications.length > 0 && (
                  <div className="text-xs text-slate-800 pt-0.5">
                    {data.certifications.join(' • ')}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Core Skills */}
          {data.skills && data.skills.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
                Skills
              </h2>
              <div className="space-y-1">
                {data.skills.map((cat, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row text-xs">
                    <span className="font-bold text-slate-900 min-w-[140px] sm:mr-2">
                      {cat.category}:
                    </span>
                    <span className="text-slate-800">{cat.items.join(', ')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

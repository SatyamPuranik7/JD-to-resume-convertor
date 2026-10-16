import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResuMatch AI - Free ATS Resume Tailorer & Job Description Matcher',
  description:
    'Paste any Job Description and your Resume to get an instant ATS match score, extract missing keywords, and export a tailored resume ready to download as PDF in 30 seconds.',
  keywords: [
    'tailor resume to job description',
    'ATS resume checker',
    'resume keyword optimizer',
    'free ATS scanner',
    'AI resume customizer',
    'job description to resume match',
    'download ATS resume pdf',
    'resume builder for tech jobs'
  ],
  authors: [{ name: 'ResuMatch AI' }],
  creator: 'ResuMatch AI',
  publisher: 'ResuMatch AI',
  metadataBase: new URL('https://resumatch.ai'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'ResuMatch AI - Tailor Your Resume to Any Job Description in 30s',
    description:
      'Beat the ATS algorithm: Instant match score, missing keyword detection, and 1-click clean PDF resume export powered by AI.',
    url: 'https://resumatch.ai',
    siteName: 'ResuMatch AI',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuMatch AI - Free ATS Resume Optimizer',
    description:
      'Upload JD and Resume, get real-time ATS scoring and an interview-ready tailored resume with 1-click PDF download.',
    creator: '@buildinpublic'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ResuMatch AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  description:
    'Free AI-powered ATS resume customizer that matches candidate resumes against job descriptions, boosts ATS scores, and exports print-ready PDFs.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

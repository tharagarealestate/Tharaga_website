'use client';

import { LegalSection } from '@/types/legal';
import { Download, Share2, BookmarkPlus, Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  lastUpdated: string;
  documentType: string;
  sections: LegalSection[];
  metadata?: {
    word_count?: number;
    reading_time_minutes?: number;
    compliance_standards?: string[];
  };
}

export function LegalDocumentLayout({ title, lastUpdated, documentType, sections, metadata }: Props) {
  const [bookmarked, setBookmarked] = useState(false);

  const handleDownloadPDF = async () => {
    // Implement PDF generation
    try {
      const response = await fetch('/api/legal/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentType}_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('PDF download failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#FBF8F2] border border-[#D6CAB5] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[#15213A] p-8 sm:p-12 text-[#F7F3EC]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="font-display text-3xl sm:text-5xl tracking-[0.04em] mb-4">{title}</h1>
            <div className="flex items-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last updated: {new Date(lastUpdated).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              {metadata?.reading_time_minutes && (
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {metadata.reading_time_minutes} min read
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-none transition-colors"
              aria-label="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-none transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-none transition-colors"
              aria-label="Bookmark"
            >
              <BookmarkPlus className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Compliance Badges */}
        {metadata?.compliance_standards && (
          <div className="mt-6 flex flex-wrap gap-2">
            {metadata.compliance_standards.map((standard) => (
              <span
                key={standard}
                className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-none text-xs font-medium"
              >
                ✓ {standard}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="prose prose-slate max-w-none">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="mb-8 scroll-mt-24">
              <h2 className="font-display text-2xl tracking-[0.03em] text-[#15213A] mb-4">{section.heading}</h2>
              <div className="font-serif text-[1.15rem] text-[#2E3648] leading-[1.7] whitespace-pre-line">
                {section.content}
              </div>

              {section.subsections && section.subsections.length > 0 && (
                <div className="mt-6 space-y-6">
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} className="ml-6 border-l-2 border-[#B0834A] pl-6">
                      <h3 className="font-display text-lg tracking-[0.03em] text-[#15213A] mb-3">
                        {subsection.heading}
                      </h3>
                      <div className="font-serif text-[1.15rem] text-[#2E3648] leading-[1.7] whitespace-pre-line">
                        {subsection.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#EFE8DC] p-6 border-t border-[#D6CAB5]">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Document Version: {new Date(lastUpdated).toISOString().split('T')[0]}</span>
          <span>{metadata?.word_count} words</span>
        </div>
      </div>
    </motion.div>
  );
}



























































































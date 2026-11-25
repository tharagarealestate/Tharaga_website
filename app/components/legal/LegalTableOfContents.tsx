'use client';

import { LegalSection } from '@/types/legal';
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface Props {
  sections: LegalSection[];
}

export function LegalTableOfContents({ sections }: Props) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-28">
      <div className="bg-[#FBF8F2] border border-[#D6CAB5] p-6">
        <h3 className="font-display text-base tracking-[0.06em] text-[#15213A] mb-4">Table of Contents</h3>
        <nav className="space-y-2">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-none transition-colors flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-[#EFE8DC] text-[#15213A] border-l-2 border-[#B0834A]'
                    : 'text-[#4A5163] hover:bg-[#EFE8DC] hover:text-[#15213A]'
                }`}
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                <span className="text-sm">{section.heading}</span>
              </button>
              {section.subsections && section.subsections.length > 0 && activeSection === section.id && (
                <div className="ml-6 mt-1 space-y-1">
                  {section.subsections.map((subsection) => (
                    <button
                      key={subsection.id}
                      onClick={() => scrollToSection(subsection.id)}
                      className="w-full text-left px-3 py-1.5 rounded-none text-xs text-[#5F6575] hover:text-[#15213A] hover:bg-[#EFE8DC] transition-colors"
                    >
                      {subsection.heading}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}



























































































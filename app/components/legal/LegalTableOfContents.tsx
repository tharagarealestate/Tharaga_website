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
    <div className="sticky top-24">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Table of Contents</h3>
        <nav className="space-y-2">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-[#D4AF37]/20 text-white font-semibold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
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
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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











































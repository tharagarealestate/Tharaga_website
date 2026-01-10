/**
 * Mobile Responsiveness Fix Script for Lead Capture Forms
 * 
 * This script applies systematic mobile fixes to all lead capture form components.
 * Run with: node scripts/fix-mobile-responsive-lead-forms.mjs
 * 
 * IMPORTANT: Review changes before committing. This script makes pattern-based replacements.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const components = [
  'ROICalculator.tsx',
  'BudgetPlanner.tsx',
  'LoanEligibilityCalculator.tsx',
  'EMICalculator.tsx',
  'NeighborhoodFinder.tsx',
  'PropertyValuation.tsx',
];

const componentDir = join(process.cwd(), 'app', 'components', 'lead-capture');

// Fix patterns
const fixes = [
  // Container padding
  {
    pattern: /className="w-full max-w-2xl mx-auto">/g,
    replacement: 'className="w-full max-w-2xl mx-auto px-4 sm:px-6">',
  },
  // Main container padding
  {
    pattern: /className="p-8 bg-gradient-to-br/g,
    replacement: 'className="p-4 sm:p-6 md:p-8 bg-gradient-to-br',
  },
  // Header layout - step 1 pattern
  {
    pattern: /<div className="flex items-center gap-4 mb-6">\s*<div className="p-4 rounded-lg/g,
    replacement: '<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">\n              <div className="p-3 sm:p-4 rounded-lg flex-shrink-0',
    multiline: true,
  },
  // Header typography
  {
    pattern: /<h3 className="text-2xl font-bold text-white">/g,
    replacement: '<h3 className="text-xl sm:text-2xl font-bold text-white">',
  },
  // Subtitle typography
  {
    pattern: /<p className="text-slate-400 mt-1">/g,
    replacement: '<p className="text-sm sm:text-base text-slate-400 mt-1">',
  },
  // Icon sizing in headers
  {
    pattern: /className="w-8 h-8 text-/g,
    replacement: 'className="w-6 h-6 sm:w-8 sm:h-8 text-',
  },
  // Form spacing
  {
    pattern: /className="space-y-6">/g,
    replacement: 'className="space-y-4 sm:space-y-6">',
  },
  // Grid cols 3 -> responsive
  {
    pattern: /className="grid grid-cols-3 gap-4/g,
    replacement: 'className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4',
  },
  // Grid cols 2 -> responsive
  {
    pattern: /className="grid grid-cols-2 gap-6/g,
    replacement: 'className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
  },
  // Button touch targets
  {
    pattern: /className="w-full py-4 px-6 bg-gradient-to-r from-([\w-]+)-600 to-([\w-]+)-500 hover:from-/g,
    replacement: 'className="w-full py-4 px-6 min-h-[52px] bg-gradient-to-r from-$1-600 to-$2-500 hover:from-',
  },
  // Button text size
  {
    pattern: /text-slate-900 font-bold text-lg rounded-lg/g,
    replacement: 'text-slate-900 font-bold text-base sm:text-lg rounded-lg',
  },
  // Button active states
  {
    pattern: /hover:-translate-y-1 disabled:/g,
    replacement: 'active:scale-[0.98] hover:-translate-y-1 disabled:',
  },
  // Add touch-manipulation
  {
    pattern: /disabled:cursor-not-allowed flex items-center/g,
    replacement: 'disabled:cursor-not-allowed flex items-center touch-manipulation',
  },
  // Input text base
  {
    pattern: /className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700/g,
    replacement: 'className="w-full pl-10 pr-4 py-3 text-base rounded-lg bg-slate-700',
  },
  // Quick action buttons
  {
    pattern: /className={`px-3 py-1 rounded text-xs font-medium/g,
    replacement: 'className={`px-3 py-2 min-h-[36px] rounded text-xs sm:text-sm font-medium touch-manipulation',
  },
];

console.log('📱 Mobile Responsiveness Fix Script');
console.log('=====================================\n');

components.forEach(component => {
  const filePath = join(componentDir, component);
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    fixes.forEach((fix, index) => {
      const before = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (before !== content) {
        console.log(`✅ ${component}: Applied fix ${index + 1}`);
      }
    });
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`\n✅ ${component}: Updated successfully\n`);
    } else {
      console.log(`⏭️  ${component}: No changes needed\n`);
    }
  } catch (error) {
    console.error(`❌ ${component}: Error - ${error.message}\n`);
  }
});

console.log('✨ All fixes applied! Review changes before committing.');






























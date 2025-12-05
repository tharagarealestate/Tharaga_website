// Script to find and replace animate-pulse with LoadingSpinner
// This is a helper script - actual replacements done via search_replace

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/app/(dashboard)/builder/properties/page.tsx',
  'app/app/(dashboard)/builder/settings/page.tsx',
  'app/app/(dashboard)/builder/leads/page.tsx',
  'app/app/(dashboard)/builder/layout.tsx',
  'app/app/(dashboard)/builder/_components/BuilderHeader.tsx',
  'app/app/(dashboard)/builder/_components/BuilderTopNav.tsx',
  'app/app/(dashboard)/builder/_components/sections/UltraAutomationAnalyticsSection.tsx',
  'app/app/(dashboard)/builder/_components/ultra-automation/components/NegotiationsDashboard.tsx',
  'app/app/(dashboard)/builder/_components/ultra-automation/components/DealLifecycleTracker.tsx',
  'app/app/(dashboard)/builder/_components/ultra-automation/components/ContractsManager.tsx',
  'app/app/(dashboard)/builder/_components/ultra-automation/components/ViewingsCalendar.tsx',
  'app/app/(dashboard)/builder/_components/ultra-automation/components/BuyerJourneyTimeline.tsx',
  'app/app/(dashboard)/builder/_components/Sidebar.tsx',
  'app/app/(dashboard)/builder/messaging/page.tsx',
  'app/app/(dashboard)/builder/analytics/page.tsx',
];

console.log('Files that need LoadingSpinner replacement:', filesToUpdate.length);









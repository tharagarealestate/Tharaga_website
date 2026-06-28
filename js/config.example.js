// js/config.example.js
// Supabase Configuration Template
//
// Instructions:
// 1. Copy this file to config.js: cp config.example.js config.js
// 2. Fill in your actual Supabase credentials
// 3. Never commit config.js to git (it's in .gitignore)
//
// Get your credentials from: https://app.supabase.com/project/_/settings/api

export const SUPABASE_CONFIG = {
  // Your Supabase project URL
  url: 'https://your-project-ref.supabase.co',

  // Public anon key (safe to use in client-side code)
  // This key respects Row Level Security (RLS) policies
  anonKey: 'your-anon-key-here'
};

// Example of what it should look like (with fake values):
// export const SUPABASE_CONFIG = {
//   url: 'https://abcdefghijk.supabase.co',
//   anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
// };

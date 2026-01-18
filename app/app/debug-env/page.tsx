'use client';

export default function DebugEnvPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
      : 'NOT SET',
  };

  // Try to import and call getSupabase to see if it works
  let supabaseStatus = 'Not tested';
  let supabaseError = '';

  try {
    // Dynamic import to catch errors
    const { getSupabase } = require('@/lib/supabase');
    const client = getSupabase();
    supabaseStatus = client ? 'SUCCESS ✓' : 'FAILED (null)';
  } catch (error: any) {
    supabaseStatus = 'ERROR ✗';
    supabaseError = error?.message || String(error);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">
          🔍 Environment Variables Debug Page
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Client-Side Environment Variables</h2>
          <div className="space-y-3 font-mono text-sm">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-blue-300 w-80">{key}:</span>
                <span className={value === 'NOT SET' ? 'text-red-400' : 'text-green-400'}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Supabase Client Initialization</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex">
              <span className="text-blue-300 w-80">Status:</span>
              <span className={supabaseStatus.includes('SUCCESS') ? 'text-green-400' : 'text-red-400'}>
                {supabaseStatus}
              </span>
            </div>
            {supabaseError && (
              <div className="mt-4 p-4 bg-red-900/50 rounded border border-red-500">
                <span className="text-red-300 font-semibold">Error:</span>
                <pre className="mt-2 text-red-200 whitespace-pre-wrap">{supabaseError}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Browser Information</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex">
              <span className="text-blue-300 w-80">User Agent:</span>
              <span className="text-gray-300 text-xs">{typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="text-blue-300 w-80">Current URL:</span>
              <span className="text-gray-300">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="text-blue-300 w-80">Timestamp:</span>
              <span className="text-gray-300">{new Date().toISOString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-500 rounded">
          <p className="text-yellow-200">
            <strong>Note:</strong> This page shows what environment variables are available
            in the browser on the live site. If NEXT_PUBLIC_ variables show "NOT SET",
            they need to be configured in Netlify.
          </p>
        </div>
      </div>
    </div>
  );
}

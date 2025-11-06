
import React from 'react';

interface ConfigurationErrorProps {
  errorType: 'missing' | 'invalid';
}

export const ConfigurationError: React.FC<ConfigurationErrorProps> = ({ errorType }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800 rounded-xl border border-amber-500/50 h-full">
      <div className="p-3 bg-amber-500/10 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-2xl font-serif font-bold text-white mb-2">
        {errorType === 'missing' ? 'Action Required: Configure API Key' : 'Authentication Error'}
      </h3>
      <p className="text-slate-300 max-w-lg mb-6">
        {errorType === 'missing'
          ? "To enable the AI features, you need to provide your Gemini API key. This is a one-time setup step on Vercel."
          : "The provided Gemini API key appears to be invalid or lacks the correct permissions. Please double-check the key you've entered."
        }
      </p>

      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 text-left w-full max-w-md">
        <h4 className="font-semibold text-lg text-white mb-3">How to Fix on Vercel</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Go to your project dashboard on Vercel.</li>
          <li>Navigate to the <span className="font-semibold text-cyan-400">Settings &gt; Environment Variables</span> section.</li>
          {/* FIX: Updated instructions to use API_KEY */}
          <li>Create a new variable:</li>
          <ul className="list-disc list-inside pl-6 mt-2 space-y-1 bg-slate-800 p-3 rounded-md">
              {/* FIX: Updated environment variable name to API_KEY */}
              <li><strong>Name:</strong> <code className="bg-slate-700 px-2 py-1 rounded-md text-sm">API_KEY</code></li>
              <li><strong>Value:</strong> <span className="italic text-slate-400">[Paste your Gemini API key here]</span></li>
          </ul>
          <li><span className="font-bold text-amber-400">Important:</span> You must redeploy your project for the change to take effect.</li>
        </ol>
      </div>
    </div>
  );
};

'use client'

import { useState } from 'react'
import { Play, Check, X } from 'lucide-react'
import { Condition } from '@/lib/automation/triggers/triggerEvaluator'

interface ConditionTesterProps {
  condition: Condition
  disabled?: boolean
}

export function ConditionTester({ condition, disabled }: ConditionTesterProps) {
  const [testData, setTestData] = useState('{}')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    try {
      const parsedData = JSON.parse(testData)
      const response = await fetch('/api/conditions/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition,
          test_data: parsedData,
        }),
      })
      const data = await response.json()
      setResult(data.data)
    } catch (error: any) {
      setResult({ matches: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Test Condition</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Test Data (JSON)</label>
          <textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            disabled={disabled || loading}
            className="w-full h-32 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50"
            placeholder='{"score": 85, "status": "hot"}'
          />
        </div>

        <button
          type="button"
          onClick={handleTest}
          disabled={disabled || loading}
          className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Testing...' : 'Test Condition'}
        </button>

        {result && (
          <div className={`p-4 rounded-xl ${
            result.matches
              ? 'bg-emerald-500/20 border border-emerald-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.matches ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <X className="w-5 h-5 text-red-400" />
              )}
              <span className={`font-semibold ${
                result.matches ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {result.matches ? 'Condition Matches' : 'Condition Does Not Match'}
              </span>
            </div>
            {result.error && (
              <div className="text-sm text-red-400 mt-2">{result.error}</div>
            )}
            {result.debug && (
              <div className="mt-2 text-xs text-gray-400">
                <pre className="whitespace-pre-wrap">{JSON.stringify(result.debug, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}











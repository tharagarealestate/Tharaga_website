'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function VoiceSearch() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'tamil' | 'english'>('tamil');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError('Failed to recognize speech. Please try again.');
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (transcript) {
            processVoiceSearch(transcript);
          }
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError('');
    setTranscript('');
    setIsListening(true);
    
    // Set language
    recognitionRef.current.lang = language === 'tamil' ? 'ta-IN' : 'en-IN';
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceSearch = async (voiceText: string) => {
    setIsProcessing(true);
    try {
      // Try enhanced AI search first, fallback to basic if unavailable
      let response = await fetch('/api/ai/enhanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: voiceText,
          userContext: { language }
        })
      });

      let data;
      if (response.ok) {
        const enhancedData = await response.json();
        if (enhancedData.success && enhancedData.intent) {
          data = {
            success: true,
            filters: enhancedData.intent.filters || {},
            insights: enhancedData.insights,
            suggestions: enhancedData.intent.suggestions || []
          };
        }
      }

      // Fallback to basic voice search API
      if (!data) {
        response = await fetch('/api/search/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: voiceText,
            language
          })
        });
        data = await response.json();
      }
      
      if (data.success && data.filters) {
        // Build search URL with filters
        const params = new URLSearchParams();
        
        if (data.filters.budget_min) params.set('budget_min', data.filters.budget_min.toString());
        if (data.filters.budget_max) params.set('budget_max', data.filters.budget_max.toString());
        if (data.filters.city) params.set('city', data.filters.city);
        if (data.filters.area) params.set('area', data.filters.area);
        if (data.filters.bhk_type) params.set('bhk', data.filters.bhk_type);
        if (data.filters.property_type) params.set('type', data.filters.property_type);
        if (data.filters.amenities) params.set('amenities', Array.isArray(data.filters.amenities) ? data.filters.amenities.join(',') : data.filters.amenities);
        
        router.push(`/properties?${params.toString()}`);
      }

      // Show suggestions if available
      if (data.suggestions && data.suggestions.length > 0) {
        console.log('Search suggestions:', data.suggestions);
      }
    } catch (error) {
      console.error('Voice search processing error:', error);
      setError('Failed to process voice search');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleQueries = language === 'tamil' ? [
    'Chennai-la 80 lakh budget-la 3BHK venum',
    'Anna Nagar-la apartment kaattunga',
    'Velachery-la 2 BHK ready to move venum',
    'T Nagar-ku close-la properties irukka'
  ] : [
    'Show me 3BHK apartments in Chennai under 80 lakhs',
    'Properties in Anna Nagar',
    'Ready to move 2BHK in Velachery',
    'Properties near T Nagar'
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6">
      {/* Language Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setLanguage('tamil')}
          className={`px-6 py-2 rounded-xl font-semibold transition-all ${
            language === 'tamil'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          தமிழ் (Tamil)
        </button>
        <button
          onClick={() => setLanguage('english')}
          className={`px-6 py-2 rounded-xl font-semibold transition-all ${
            language === 'english'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          English
        </button>
      </div>

      {/* Microphone Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-gradient-to-br from-[#D4AF37] to-[#1e40af] hover:shadow-2xl'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-16 h-16 text-white" />
          ) : (
            <Mic className="w-16 h-16 text-white" />
          )}
        </button>

        <p className="mt-6 text-center text-slate-700 font-medium">
          {isListening 
            ? language === 'tamil' 
              ? 'பேசுங்கள்... (Speak now...)'
              : 'Speak now...'
            : language === 'tamil'
              ? 'மைக்கை கிளிக் செய்து பேசுங்கள்'
              : 'Click microphone to speak'
          }
        </p>

        {/* Transcript Display */}
        {transcript && (
          <div className="mt-6 w-full p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              {isProcessing ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-sm text-blue-900 font-medium mb-1">
                  {isProcessing ? 'Processing...' : 'You said:'}
                </div>
                <div className="text-blue-800">{transcript}</div>
              </div>
              <button
                onClick={() => setTranscript('')}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 w-full p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Example Queries */}
        <div className="mt-8 w-full">
          <p className="text-sm font-medium text-slate-700 mb-3">
            {language === 'tamil' ? 'உதாரணங்கள்:' : 'Example queries:'}
          </p>
          <div className="space-y-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setTranscript(example);
                  processVoiceSearch(example);
                }}
                className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-700 transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


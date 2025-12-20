'use client';

import { useState } from 'react';
import { Search, Mic, MapPin, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PropertySearchInterface() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickFilters, setShowQuickFilters] = useState(false);
  const [quickFilters, setQuickFilters] = useState({
    bhk: '',
    minPrice: '',
    maxPrice: '',
    city: 'Chennai'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery) params.append('q', searchQuery);
    if (quickFilters.bhk) params.append('bhk_type', quickFilters.bhk);
    if (quickFilters.minPrice) params.append('min_price', quickFilters.minPrice);
    if (quickFilters.maxPrice) params.append('max_price', quickFilters.maxPrice);
    if (quickFilters.city) params.append('city', quickFilters.city);

    router.push(`/property-listing?${params.toString()}`);
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
      };
      recognition.start();
    } else {
      alert('Voice search not supported in this browser');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 -mt-8 relative z-10">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Main Search Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, property name, or builder..."
              className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-xl text-lg focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Voice search"
            >
              <Mic className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#1e40af] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Search
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowQuickFilters(!showQuickFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Quick Filters
          </button>

          <select
            value={quickFilters.bhk}
            onChange={(e) => setQuickFilters(prev => ({ ...prev, bhk: e.target.value }))}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="">All BHK</option>
            <option value="1BHK">1 BHK</option>
            <option value="2BHK">2 BHK</option>
            <option value="3BHK">3 BHK</option>
            <option value="4BHK">4 BHK</option>
          </select>

          <select
            value={quickFilters.city}
            onChange={(e) => setQuickFilters(prev => ({ ...prev, city: e.target.value }))}
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white"
          >
            <option value="Chennai">Chennai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={quickFilters.minPrice}
              onChange={(e) => setQuickFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              className="w-32 px-4 py-2 border border-slate-200 rounded-lg"
            />
            <span className="text-slate-400">to</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={quickFilters.maxPrice}
              onChange={(e) => setQuickFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="w-32 px-4 py-2 border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {/* Popular Searches */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-slate-600">Popular:</span>
          {['3BHK in Velachery', 'Villa in OMR', 'Under ₹80L', 'Ready to Move'].map(search => (
            <button
              key={search}
              type="button"
              onClick={() => setSearchQuery(search)}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full transition-colors"
            >
              {search}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}


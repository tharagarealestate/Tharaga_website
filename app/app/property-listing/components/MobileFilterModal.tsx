'use client';

import { useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyFilters } from '../page';
import PropertyListingSidebar from './PropertyListingSidebar';
import { formatIndianNumber } from '@/lib/utils/currency';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  propertiesCount: number;
}

export default function MobileFilterModal({
  isOpen,
  onClose,
  filters,
  updateFilters,
  resetFilters,
  propertiesCount,
}: MobileFilterModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Premium backdrop with blur */}
      <div
        className="fixed inset-0 z-50 lg:hidden bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-pink-900/80 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal with glassmorphic effect */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden flex flex-col max-h-[90vh] animate-slide-in-up">
        {/* Glassmorphic header */}
        <div className="bg-white/90 backdrop-blur-xl border-t-4 border-indigo-500 rounded-t-3xl p-4 flex items-center justify-between shadow-[0_-8px_32px_0_rgba(31,38,135,0.2)]">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Filters
            </span>
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 flex items-center justify-center hover:bg-white/70 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Scrollable content with gradient background */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
          <PropertyListingSidebar
            filters={filters}
            updateFilters={updateFilters}
            resetFilters={resetFilters}
            propertiesCount={propertiesCount}
          />
        </div>

        {/* Glassmorphic sticky footer */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-white/60 p-4 flex gap-3 shadow-[0_-8px_32px_0_rgba(31,38,135,0.15)]">
          <button
            onClick={resetFilters}
            className="flex-1 py-4 rounded-xl font-semibold bg-white/70 backdrop-blur-sm border border-white/80 text-gray-700 hover:bg-white active:scale-98 transition-all"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-4 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/50 active:scale-98 transition-all"
          >
            Show {formatIndianNumber(propertiesCount)} Properties
          </button>
        </div>
      </div>
    </>
  );
}


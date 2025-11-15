'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Home, Bed, Sofa, Wind, Ruler, Sparkles, SlidersHorizontal, MapPin } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PropertyFilters } from '../page';
import { formatIndianCurrency } from '@/lib/utils/currency';

interface PropertyListingSidebarProps {
  filters: PropertyFilters;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  propertiesCount: number;
}

// Expandable section states
type FilterSections = {
  location: boolean;
  price: boolean;
  propertyType: boolean;
  bhk: boolean;
  furnished: boolean;
  facing: boolean;
  area: boolean;
  amenities: boolean;
  metro: boolean;
};

export default function PropertyListingSidebar({
  filters,
  updateFilters,
  resetFilters,
  propertiesCount,
}: PropertyListingSidebarProps) {
  // Track which sections are expanded (default: all open)
  const [expandedSections, setExpandedSections] = useState<FilterSections>({
    location: true,
    price: true,
    propertyType: true,
    bhk: true,
    furnished: false,
    facing: false,
    area: false,
    amenities: false,
    metro: false,
  });

  const [localitySearch, setLocalitySearch] = useState('');
  const [amenitySearch, setAmenitySearch] = useState('');

  // Toggle section expansion
  const toggleSection = (section: keyof FilterSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Predefined data (should come from Supabase in production)
  const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'];
  const localities = ['Adyar', 'Velachery', 'Anna Nagar', 'T Nagar', 'Nungambakkam', 'OMR', 'ECR'];
  const amenitiesList = [
    'Swimming Pool',
    'Gym',
    'Parking',
    'Security',
    'Power Backup',
    'Lift',
    'Garden',
    'Play Area',
    'Club House',
    'CCTV',
  ];

  return (
    <div className="relative">
      {/* Premium gradient background (subtle version) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 -z-10" />
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none -z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Main sidebar content */}
      <div className="relative p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </h2>
          <Button
            variant="invisible"
            size="sm"
            onClick={resetFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Clear All
          </Button>
        </div>

        {/* RESULTS COUNT */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg shadow-indigo-500/30">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white/80 text-xs font-medium">Properties Found</div>
              <div className="text-white text-2xl font-bold">
                {propertiesCount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-gray-200" />

        {/* FILTER SECTIONS */}
        <div className="space-y-4">
          
          {/* 1. LOCATION FILTER */}
          <FilterSection
            icon={<MapPin className="w-4 h-4" />}
            title="Location"
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            {/* City Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">City</Label>
              <div className="space-y-2">
                {cities.map((city) => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={filters.city.includes(city)}
                      onCheckedChange={(checked) => {
                        const newCities = checked
                          ? [...filters.city, city]
                          : filters.city.filter((c) => c !== city);
                        updateFilters({ city: newCities });
                      }}
                    />
                    <label
                      htmlFor={`city-${city}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {city}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Locality Selection with Search */}
            <div className="space-y-2 pt-4">
              <Label className="text-xs font-medium text-gray-600">Locality</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search locality..."
                  value={localitySearch}
                  onChange={(e) => setLocalitySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {localities
                  .filter((loc) => loc.toLowerCase().includes(localitySearch.toLowerCase()))
                  .map((locality) => (
                    <div key={locality} className="flex items-center space-x-2">
                      <Checkbox
                        id={`locality-${locality}`}
                        checked={filters.locality.includes(locality)}
                        onCheckedChange={(checked) => {
                          const newLocalities = checked
                            ? [...filters.locality, locality]
                            : filters.locality.filter((l) => l !== locality);
                          updateFilters({ locality: newLocalities });
                        }}
                      />
                      <label
                        htmlFor={`locality-${locality}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {locality}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </FilterSection>

          {/* 2. PRICE FILTER */}
          <FilterSection
            icon={<span className="text-sm">₹</span>}
            title="Price Range"
            isExpanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatIndianCurrency(filters.priceMin)}
                </div>
                <div className="text-gray-400">—</div>
                <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatIndianCurrency(filters.priceMax)}
                </div>
              </div>
              
              {/* Dual Range Slider */}
              <div className="px-2">
                <Slider
                  min={0}
                  max={200000000}
                  step={100000}
                  value={[filters.priceMin, filters.priceMax]}
                  onValueChange={([min, max]) => {
                    updateFilters({ priceMin: min, priceMax: max });
                  }}
                  className="w-full"
                />
              </div>

              {/* Quick Price Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Under 50L', max: 5000000 },
                  { label: '50L-1Cr', min: 5000000, max: 10000000 },
                  { label: '1Cr-2Cr', min: 10000000, max: 20000000 },
                  { label: 'Above 2Cr', min: 20000000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      updateFilters({
                        priceMin: preset.min || 0,
                        priceMax: preset.max || 200000000,
                      });
                    }}
                    className="px-3 py-2 text-xs font-medium bg-white/50 backdrop-blur-sm border border-white/60 rounded-lg hover:bg-white/70 hover:border-indigo-300 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* 3. PROPERTY TYPE FILTER */}
          <FilterSection
            icon={<Home className="w-4 h-4" />}
            title="Property Type"
            isExpanded={expandedSections.propertyType}
            onToggle={() => toggleSection('propertyType')}
          >
            <div className="space-y-2">
              {[
                { value: 'apartment', label: 'Apartment', icon: '🏢' },
                { value: 'villa', label: 'Villa', icon: '🏡' },
                { value: 'plot', label: 'Plot', icon: '📐' },
                { value: 'independent_house', label: 'Independent House', icon: '🏠' },
              ].map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.propertyType.includes(type.value as any)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...filters.propertyType, type.value as any]
                        : filters.propertyType.filter((t) => t !== type.value);
                      updateFilters({ propertyType: newTypes });
                    }}
                  />
                  <label
                    htmlFor={`type-${type.value}`}
                    className="text-sm cursor-pointer flex items-center gap-2 flex-1"
                  >
                    <span>{type.icon}</span>
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* 4. BHK FILTER */}
          <FilterSection
            icon={<Bed className="w-4 h-4" />}
            title="BHK"
            isExpanded={expandedSections.bhk}
            onToggle={() => toggleSection('bhk')}
          >
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((bhk) => (
                <button
                  key={bhk}
                  onClick={() => {
                    const newBhk = filters.bhk.includes(bhk as any)
                      ? filters.bhk.filter((b) => b !== bhk)
                      : [...filters.bhk, bhk as any];
                    updateFilters({ bhk: newBhk });
                  }}
                  className={`aspect-square rounded-xl font-semibold text-lg transition-all duration-200 active:scale-95 ${
                    filters.bhk.includes(bhk as any)
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/50 border-2 border-white/30'
                      : 'bg-white/50 backdrop-blur-sm text-gray-700 border border-white/60 hover:bg-white/70 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {bhk}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* 5. FURNISHED STATUS FILTER */}
          <FilterSection
            icon={<Sofa className="w-4 h-4" />}
            title="Furnished Status"
            isExpanded={expandedSections.furnished}
            onToggle={() => toggleSection('furnished')}
          >
            <RadioGroup
              value={filters.furnishedStatus[0]}
              onValueChange={(value) => {
                updateFilters({ furnishedStatus: [value as any] });
              }}
            >
              {[
                { value: 'any', label: 'Any' },
                { value: 'furnished', label: 'Fully Furnished' },
                { value: 'semi_furnished', label: 'Semi Furnished' },
                { value: 'unfurnished', label: 'Unfurnished' },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`furnished-${option.value}`} />
                  <Label htmlFor={`furnished-${option.value}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FilterSection>

          {/* 6. FACING FILTER */}
          <FilterSection
            icon={<Wind className="w-4 h-4" />}
            title="Facing"
            isExpanded={expandedSections.facing}
            onToggle={() => toggleSection('facing')}
          >
            <RadioGroup
              value={filters.facing[0]}
              onValueChange={(value) => {
                updateFilters({ facing: [value as any] });
              }}
            >
              {[
                { value: 'any', label: 'Any', icon: '🧭' },
                { value: 'east', label: 'East', icon: '☀️' },
                { value: 'west', label: 'West', icon: '🌅' },
                { value: 'north', label: 'North', icon: '⬆️' },
                { value: 'south', label: 'South', icon: '⬇️' },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`facing-${option.value}`} />
                  <Label
                    htmlFor={`facing-${option.value}`}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FilterSection>

          {/* 7. AREA FILTER */}
          <FilterSection
            icon={<Ruler className="w-4 h-4" />}
            title="Area (sqft)"
            isExpanded={expandedSections.area}
            onToggle={() => toggleSection('area')}
          >
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-700">
                {filters.areaMin} - {filters.areaMax} sqft
              </div>
              <div className="px-2">
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={[filters.areaMin, filters.areaMax]}
                  onValueChange={([min, max]) => {
                    updateFilters({ areaMin: min, areaMax: max });
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </FilterSection>

          {/* 8. AMENITIES FILTER */}
          <FilterSection
            icon={<Sparkles className="w-4 h-4" />}
            title="Amenities"
            isExpanded={expandedSections.amenities}
            onToggle={() => toggleSection('amenities')}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search amenities..."
                  value={amenitySearch}
                  onChange={(e) => setAmenitySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {amenitiesList
                  .filter((amenity) => amenity.toLowerCase().includes(amenitySearch.toLowerCase()))
                  .map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={filters.amenities.includes(amenity)}
                        onCheckedChange={(checked) => {
                          const newAmenities = checked
                            ? [...filters.amenities, amenity]
                            : filters.amenities.filter((a) => a !== amenity);
                          updateFilters({ amenities: newAmenities });
                        }}
                      />
                      <label
                        htmlFor={`amenity-${amenity}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </FilterSection>

          {/* 9. NEAR METRO FILTER */}
          <FilterSection
            icon={<span className="text-sm">🚇</span>}
            title="Near Metro"
            isExpanded={expandedSections.metro}
            onToggle={() => toggleSection('metro')}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="near-metro"
                  checked={filters.nearMetro}
                  onCheckedChange={(checked) => {
                    updateFilters({ nearMetro: checked as boolean });
                  }}
                />
                <label htmlFor="near-metro" className="text-sm cursor-pointer">
                  Only show properties near metro
                </label>
              </div>
              
              {filters.nearMetro && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Walking distance: {filters.metroDistance} minutes
                  </Label>
                  <Slider
                    min={5}
                    max={30}
                    step={5}
                    value={[filters.metroDistance]}
                    onValueChange={([value]) => {
                      updateFilters({ metroDistance: value });
                    }}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </FilterSection>
        </div>

        {/* BOTTOM SPACING */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// Reusable Filter Section Component
interface FilterSectionProps {
  icon: React.ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ icon, title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="relative overflow-hidden bg-white/60 backdrop-blur-md backdrop-saturate-180 border border-white/40 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-300 hover:border-white/60 group">
      {/* Inner glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
      </div>
      
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="relative w-full flex items-center justify-between p-4 hover:bg-white/30 transition-all duration-200 rounded-t-2xl"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 font-semibold text-sm text-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <div className="text-white filter drop-shadow-sm">
              {icon}
            </div>
          </div>
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600 transition-transform duration-200" />
        )}
      </button>

      {/* Section Content with smooth expansion */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-white/40">
          {children}
        </div>
      </div>
    </div>
  );
}


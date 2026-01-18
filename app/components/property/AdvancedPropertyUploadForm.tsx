"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Image as ImageIcon,
  Video,
  MapPin,
  DollarSign,
  Home,
  FileText,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useToast } from '@/components/ui/toast';
// Using native file inputs instead of react-dropzone

interface PropertyUploadFormData {
  // Step 1: Basic Information
  title: string;
  description: string;
  project: string;
  property_type: 'Apartment' | 'Villa' | 'Plot' | 'Commercial';
  bhk_type?: '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK+';
  
  // Step 2: Property Details
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  carpet_area?: number;
  builtup_area?: number;
  super_buildup_area?: number;
  plot_area?: number;
  floor?: number;
  total_floors?: number;
  facing?: string;
  parking?: number;
  balcony_count?: number;
  furnishing_status?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  
  // Step 3: Location
  city: string;
  locality?: string;
  state?: string;
  address?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  
  // Step 4: Pricing
  price_inr: number;
  price_per_sqft?: number;
  negotiable: boolean;
  base_price?: number;
  
  // Step 5: Media
  images: string[];
  videos: string[];
  floor_plan_images: string[];
  virtual_tour_url?: string;
  
  // Step 6: Amenities & Features
  amenities: string[];
  
  // Step 7: Documents
  rera_id?: string;
  rera_verified: boolean;
  rera_certificate_url?: string;
  oc_certificate?: string;
  cc_certificate?: string;
  approved_plan_url?: string;
  
  // Step 8: Metadata
  property_metadata?: {
    rera_number?: string;
    completion_certificate?: boolean;
    occupancy_certificate?: boolean;
    approved_by?: string[];
    construction_year?: number;
    possession_date?: string;
    water_source?: string[];
    power_backup?: string;
    security_features?: string[];
    green_features?: string[];
    vastu_compliant?: boolean;
  };
  
  // Admin fields
  uploaded_for_builder_id?: string;
  upload_source: 'builder_direct' | 'admin_on_behalf' | 'api_import' | 'bulk_upload';
}

interface AdvancedPropertyUploadFormProps {
  builderId?: string; // For admin uploads
  onSuccess?: (propertyId: string) => void;
  onCancel?: () => void;
}

const TOTAL_STEPS = 8;

export function AdvancedPropertyUploadForm({
  builderId,
  onSuccess,
  onCancel,
}: AdvancedPropertyUploadFormProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PropertyUploadFormData>({
    title: '',
    description: '',
    project: '',
    property_type: 'Apartment',
    bhk_type: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    sqft: undefined,
    carpet_area: undefined,
    builtup_area: undefined,
    super_buildup_area: undefined,
    plot_area: undefined,
    floor: undefined,
    total_floors: undefined,
    facing: undefined,
    parking: undefined,
    balcony_count: undefined,
    furnishing_status: undefined,
    city: '',
    locality: '',
    state: '',
    address: '',
    pincode: '',
    lat: undefined,
    lng: undefined,
    price_inr: 0,
    price_per_sqft: undefined,
    negotiable: true,
    base_price: undefined,
    images: [],
    videos: [],
    floor_plan_images: [],
    virtual_tour_url: '',
    amenities: [],
    rera_id: '',
    rera_verified: false,
    rera_certificate_url: '',
    oc_certificate: '',
    cc_certificate: '',
    approved_plan_url: '',
    property_metadata: {},
    uploaded_for_builder_id: builderId,
    upload_source: builderId ? 'admin_on_behalf' : 'builder_direct',
  });

  // File upload handlers using native file inputs
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            videos: [...prev.videos, reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFloorPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            floor_plan_images: [...prev.floor_plan_images, reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title || formData.title.length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        }
        if (!formData.property_type) {
          newErrors.property_type = 'Property type is required';
        }
        break;

      case 2:
        // Property details are mostly optional
        break;

      case 3:
        if (!formData.city || formData.city.length < 2) {
          newErrors.city = 'City is required';
        }
        break;

      case 4:
        if (!formData.price_inr || formData.price_inr <= 0) {
          newErrors.price_inr = 'Price is required and must be greater than 0';
        }
        break;

      case 5:
        if (formData.images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;

      case 6:
      case 7:
      case 8:
        // Optional steps
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/properties/upload-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload property');
      }

      setPropertyId(data.propertyId);
      setSuccess(true);
      
      // Show success toast
      showToast({
        type: 'success',
        title: 'Property Uploaded Successfully!',
        message: 'Your property is pending verification.',
      });
      
      if (onSuccess) {
        onSuccess(data.propertyId);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload property. Please try again.';
      setErrors({ submit: errorMessage });
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const removeFloorPlan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      floor_plan_images: prev.floor_plan_images.filter((_, i) => i !== index),
    }));
  };

  // Common amenities list
  const commonAmenities = [
    'Swimming Pool', 'Gym', 'Park', 'Security', 'Power Backup', 'Lift',
    'Parking', 'Clubhouse', 'Playground', 'Garden', 'WiFi', 'CCTV',
    'Water Supply', 'Rainwater Harvesting', 'Solar Power', 'Waste Management',
  ];

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 bg-slate-800/95 glow-border rounded-xl shadow-2xl border border-slate-700/50"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Property Uploaded Successfully!</h2>
          <p className="text-slate-300 mb-4">
            Your property has been uploaded and is pending verification.
          </p>
          {propertyId && (
            <p className="text-sm text-slate-400 mb-6">Property ID: {propertyId}</p>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSuccess(false);
                setCurrentStep(1);
                setFormData({
                  ...formData,
                  title: '',
                  description: '',
                  images: [],
                  videos: [],
                  floor_plan_images: [],
                });
              }}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border"
            >
              Upload Another Property
            </motion.button>
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-8 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-600/50"
              >
                Close
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const formSteps = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'details', label: 'Details' },
    { id: 'location', label: 'Location' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'images', label: 'Images' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'documents', label: 'Documents' },
    { id: 'review', label: 'Review' },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Progress Bar */}
      <ProgressBar 
        steps={formSteps}
        currentStep={currentStep - 1}
        className="mb-8"
      />

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Home className="w-6 h-6 text-amber-300" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Property Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Luxury 3BHK Apartment in Prime Location"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                      placeholder="Describe your property..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Project Name</label>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, project: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Green Valley Residency"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Property Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.property_type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            property_type: e.target.value as any,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      >
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    {formData.property_type === 'Apartment' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">BHK Type</label>
                        <select
                          value={formData.bhk_type || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              bhk_type: e.target.value as any,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        >
                          <option value="">Select BHK</option>
                          <option value="1RK">1RK</option>
                          <option value="1BHK">1BHK</option>
                          <option value="2BHK">2BHK</option>
                          <option value="3BHK">3BHK</option>
                          <option value="4BHK">4BHK</option>
                          <option value="5BHK+">5BHK+</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Building2 className="w-6 h-6 text-amber-300" />
                  Property Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.bedrooms || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bedrooms: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.bathrooms || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bathrooms: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Carpet Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.carpet_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          carpet_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Built-up Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.builtup_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          builtup_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Super Built-up Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.super_buildup_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          super_buildup_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Plot Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.plot_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          plot_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Floor Number</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.floor || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          floor: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Total Floors</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.total_floors || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          total_floors: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Facing</label>
                    <select
                      value={formData.facing || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, facing: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    >
                      <option value="">Select Facing</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North-East">North-East</option>
                      <option value="North-West">North-West</option>
                      <option value="South-East">South-East</option>
                      <option value="South-West">South-West</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Parking Slots</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.parking || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          parking: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Furnishing Status</label>
                    <select
                      value={formData.furnishing_status || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          furnishing_status: e.target.value as any,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="fully-furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <MapPin className="w-6 h-6 text-amber-300" />
                  Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Bangalore"
                    />
                    {errors.city && (
                      <p className="text-red-400 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Locality</label>
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, locality: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Whitefield"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Karnataka"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="Full address..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, pincode: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        placeholder="560001"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <DollarSign className="w-6 h-6 text-amber-300" />
                  Pricing
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Price (INR) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.price_inr || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price_inr: e.target.value ? parseFloat(e.target.value) : 0,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="5000000"
                    />
                    {errors.price_inr && (
                      <p className="text-red-400 text-sm mt-1">{errors.price_inr}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Price per sqft</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.price_per_sqft || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price_per_sqft: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="Auto-calculated if area provided"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="negotiable"
                      checked={formData.negotiable}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, negotiable: e.target.checked }))
                      }
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor="negotiable" className="text-sm font-medium text-slate-300">
                      Price is negotiable
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Media */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <ImageIcon className="w-6 h-6 text-amber-300" />
                  Media
                </h2>
                <div className="space-y-6">
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Property Images <span className="text-red-400">*</span>
                    </label>
                    <label className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all block glow-border">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                      <p className="text-sm text-slate-300">
                        Click to select images
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPEG, PNG, WebP (max 10MB each)
                      </p>
                    </label>
                    {errors.images && (
                      <p className="text-red-400 text-sm mt-1">{errors.images}</p>
                    )}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Property ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-600/50 glow-border"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Videos */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Property Videos</label>
                    <label className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all block glow-border">
                      <input
                        type="file"
                        accept="video/mp4,video/mov,video/webm"
                        multiple
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                      <Video className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                      <p className="text-sm text-slate-300">
                        Click to select videos
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        MP4, MOV, WebM (max 50MB each)
                      </p>
                    </label>
                    {formData.videos.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.videos.map((video, index) => (
                          <div key={index} className="relative group">
                            <video
                              src={video}
                              className="w-full h-32 object-cover rounded-lg border border-slate-600/50 glow-border"
                              controls
                            />
                            <button
                              onClick={() => removeVideo(index)}
                              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Floor Plans */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Floor Plans</label>
                    <label className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all block glow-border">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        multiple
                        onChange={handleFloorPlanChange}
                        className="hidden"
                      />
                      <FileText className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                      <p className="text-sm text-slate-300">
                        Click to select floor plans
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPEG, PNG, PDF (max 10MB each)
                      </p>
                    </label>
                    {formData.floor_plan_images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.floor_plan_images.map((plan, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={plan}
                              alt={`Floor Plan ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-600/50 glow-border"
                            />
                            <button
                              onClick={() => removeFloorPlan(index)}
                              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Virtual Tour */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Virtual Tour URL</label>
                    <input
                      type="url"
                      value={formData.virtual_tour_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, virtual_tour_url: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Amenities */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Amenities & Features</h2>
                <div className="grid grid-cols-3 gap-3">
                  {commonAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              amenities: [...prev.amenities, amenity],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              amenities: prev.amenities.filter((a) => a !== amenity),
                            }));
                          }
                        }}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-slate-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Documents */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <FileText className="w-6 h-6 text-amber-300" />
                  Documents & Certificates
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">RERA ID</label>
                    <input
                      type="text"
                      value={formData.rera_id}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, rera_id: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., PRM/KA/RERA/1251/308/PR/171021/004234"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rera_verified"
                      checked={formData.rera_verified}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, rera_verified: e.target.checked }))
                      }
                        className="w-4 h-4 accent-amber-500"
                      />
                      <label htmlFor="rera_verified" className="text-sm font-medium text-slate-300">
                      RERA Verified
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">RERA Certificate URL</label>
                    <input
                      type="url"
                      value={formData.rera_certificate_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rera_certificate_url: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Occupancy Certificate</label>
                    <input
                      type="text"
                      value={formData.oc_certificate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, oc_certificate: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="OC Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Completion Certificate</label>
                    <input
                      type="text"
                      value={formData.cc_certificate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cc_certificate: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="CC Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Approved Plan URL</label>
                    <input
                      type="url"
                      value={formData.approved_plan_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, approved_plan_url: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Additional Metadata */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Additional Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Construction Year</label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 5}
                      value={formData.property_metadata?.construction_year || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_metadata: {
                            ...prev.property_metadata,
                            construction_year: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Possession Date</label>
                    <input
                      type="date"
                      value={formData.property_metadata?.possession_date || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_metadata: {
                            ...prev.property_metadata,
                            possession_date: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="vastu_compliant"
                      checked={formData.property_metadata?.vastu_compliant || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_metadata: {
                            ...prev.property_metadata,
                            vastu_compliant: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor="vastu_compliant" className="text-sm font-medium text-slate-300">
                      Vastu Compliant
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Message - Billing Design System */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-rose-500/20 border border-rose-400/50 rounded-lg flex items-center gap-2 text-rose-100"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errors.submit}</p>
        </motion.div>
      )}

      {/* Navigation Buttons - Billing Design System */}
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
        <button
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={loading}
          className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white disabled:opacity-50 flex items-center gap-2 transition-all duration-300 border border-slate-600/50"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </button>

        <div className="flex gap-4">
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Property
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

